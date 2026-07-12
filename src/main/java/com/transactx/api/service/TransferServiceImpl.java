package com.transactx.api.service;

import com.transactx.api.domain.*;
import com.transactx.api.dto.AtmDto;
import com.transactx.api.exception.*;
import com.transactx.api.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class TransferServiceImpl implements TransferService {

    private static final Logger log = LoggerFactory.getLogger(TransferServiceImpl.class);
    private static final String IDEMPOTENCY_PREFIX = "idempotency:transfer:";

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final StringRedisTemplate redisTemplate;

    public TransferServiceImpl(
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            LedgerEntryRepository ledgerEntryRepository,
            UserRepository userRepository,
            AuditService auditService,
            StringRedisTemplate redisTemplate) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.redisTemplate = redisTemplate;
    }

    @Override
    @Transactional
    public AtmDto.TransactionResponse transfer(AtmDto.TransferRequest request, String lockingType, 
                                                String username, String ipAddress, String device) {
        
        String srcAccNum = request.getSourceAccountNumber();
        String destAccNum = request.getDestinationAccountNumber();

        if (srcAccNum.equals(destAccNum)) {
            throw new InvalidTransactionException("Source and destination accounts must be different");
        }

        // 1. Idempotency Check using Redis
        String idempotencyKey = request.getIdempotencyKey();
        String redisKey = IDEMPOTENCY_PREFIX + idempotencyKey;
        Boolean isDuplicate = redisTemplate.opsForValue().setIfAbsent(redisKey, "PROCESSING", 10, TimeUnit.MINUTES);
        
        if (Boolean.FALSE.equals(isDuplicate)) {
            throw new InvalidTransactionException("Duplicate request detected. Idempotency key: " + idempotencyKey);
        }

        String transactionRef = "TX-REF-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);

        try {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            // 2. Load Accounts with Ordered Lock Acquisition (Prevents Deadlocks)
            Account sourceAccount;
            Account destAccount;

            boolean lockInOrder = srcAccNum.compareTo(destAccNum) < 0;
            String firstToLock = lockInOrder ? srcAccNum : destAccNum;
            String secondToLock = lockInOrder ? destAccNum : srcAccNum;

            if ("PESSIMISTIC".equalsIgnoreCase(lockingType)) {
                log.info("Acquiring PESSIMISTIC locks in order: {}, then {}", firstToLock, secondToLock);
                Account first = accountRepository.findByAccountNumberWithPessimisticLock(firstToLock)
                        .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + firstToLock));
                Account second = accountRepository.findByAccountNumberWithPessimisticLock(secondToLock)
                        .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + secondToLock));

                sourceAccount = srcAccNum.equals(first.getAccountNumber()) ? first : second;
                destAccount = destAccNum.equals(first.getAccountNumber()) ? first : second;
            } else {
                log.info("Acquiring OPTIMISTIC locks in order: {}, then {}", firstToLock, secondToLock);
                Account first = accountRepository.findByAccountNumber(firstToLock)
                        .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + firstToLock));
                Account second = accountRepository.findByAccountNumber(secondToLock)
                        .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + secondToLock));

                sourceAccount = srcAccNum.equals(first.getAccountNumber()) ? first : second;
                destAccount = destAccNum.equals(first.getAccountNumber()) ? first : second;
            }

            // 3. Validations
            if ("FROZEN".equals(sourceAccount.getStatus())) {
                throw new AccountFrozenException("Source account is frozen: " + srcAccNum);
            }
            if ("FROZEN".equals(destAccount.getStatus())) {
                throw new AccountFrozenException("Destination account is frozen: " + destAccNum);
            }

            BigDecimal amount = request.getAmount();
            if (sourceAccount.getBalance().compareTo(amount) < 0) {
                throw new InsufficientBalanceException("Insufficient balance in account: " + srcAccNum);
            }

            // 4. Update balances
            BigDecimal srcBefore = sourceAccount.getBalance();
            BigDecimal destBefore = destAccount.getBalance();

            sourceAccount.setBalance(srcBefore.subtract(amount));
            destAccount.setBalance(destBefore.add(amount));

            accountRepository.save(sourceAccount);
            accountRepository.save(destAccount);

            // 5. Create Ledger Entries (Immutable double-entry)
            LedgerEntry debitEntry = LedgerEntry.builder()
                    .transactionRef(transactionRef)
                    .account(sourceAccount)
                    .entryType("DEBIT")
                    .amount(amount)
                    .balanceSnapshot(sourceAccount.getBalance())
                    .build();

            LedgerEntry creditEntry = LedgerEntry.builder()
                    .transactionRef(transactionRef)
                    .account(destAccount)
                    .entryType("CREDIT")
                    .amount(amount)
                    .balanceSnapshot(destAccount.getBalance())
                    .build();

            ledgerEntryRepository.save(debitEntry);
            ledgerEntryRepository.save(creditEntry);

            // 6. Create Transaction Log for Sender
            Transaction sourceTx = Transaction.builder()
                    .transactionRef(transactionRef)
                    .account(sourceAccount)
                    .user(user)
                    .type(TransactionType.TRANSFER_OUT)
                    .status(TransactionStatus.SUCCESS)
                    .beforeBalance(srcBefore)
                    .afterBalance(sourceAccount.getBalance())
                    .amount(amount)
                    .build();

            Transaction savedTx = transactionRepository.save(sourceTx);

            // Create Transaction Log for Receiver
            Transaction destTx = Transaction.builder()
                    .transactionRef(transactionRef)
                    .account(destAccount)
                    .user(destAccount.getUser())
                    .type(TransactionType.TRANSFER_IN)
                    .status(TransactionStatus.SUCCESS)
                    .beforeBalance(destBefore)
                    .afterBalance(destAccount.getBalance())
                    .amount(amount)
                    .build();

            transactionRepository.save(destTx);

            // Update Idempotency status in Redis to SUCCESS
            redisTemplate.opsForValue().set(redisKey, "SUCCESS", 24, TimeUnit.HOURS);

            auditService.log(
                    user.getId(),
                    "TRANSFER_COMPLETED",
                    ipAddress,
                    device,
                    Map.of("sourceAccount", srcAccNum, "destAccount", destAccNum, "amount", amount),
                    Map.of("sourceBalance", sourceAccount.getBalance(), "destBalance", destAccount.getBalance()),
                    transactionRef
            );

            return AtmDto.TransactionResponse.builder()
                    .id(savedTx.getId())
                    .transactionRef(transactionRef)
                    .accountNumber(srcAccNum)
                    .type("TRANSFER_OUT")
                    .status("SUCCESS")
                    .beforeBalance(srcBefore)
                    .afterBalance(sourceAccount.getBalance())
                    .amount(amount)
                    .timestamp(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            // Save failure status to Redis for idempotency tracking
            redisTemplate.opsForValue().set(redisKey, "FAILED", 24, TimeUnit.HOURS);
            
            // Record failed transaction for auditing in a separate transaction boundary
            logFailedTransaction(srcAccNum, destAccNum, request.getAmount(), transactionRef, e.getMessage(), username);
            
            throw e;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Transaction> getTransactionHistory(String accountNumber, Pageable pageable) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        return transactionRepository.findByAccountId(account.getId(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Transaction> getUserTransactionHistory(UUID userId, Pageable pageable) {
        return transactionRepository.findByUserId(userId, pageable);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailedTransaction(String srcAccNum, String destAccNum, BigDecimal amount, 
                                     String transactionRef, String failureReason, String username) {
        log.warn("Transfer failed: Ref={}, Reason={}", transactionRef, failureReason);
        try {
            User user = userRepository.findByUsername(username).orElse(null);
            Account account = accountRepository.findByAccountNumber(srcAccNum).orElse(null);

            Transaction failedTx = Transaction.builder()
                    .transactionRef(transactionRef)
                    .account(account)
                    .user(user)
                    .type(TransactionType.TRANSFER_OUT)
                    .status(TransactionStatus.FAILED)
                    .beforeBalance(account != null ? account.getBalance() : BigDecimal.ZERO)
                    .afterBalance(account != null ? account.getBalance() : BigDecimal.ZERO)
                    .amount(amount)
                    .build();
            transactionRepository.save(failedTx);
        } catch (Exception ex) {
            log.error("Failed to write failure transaction audit", ex);
        }
    }
}
