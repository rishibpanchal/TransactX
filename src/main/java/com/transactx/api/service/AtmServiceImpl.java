package com.transactx.api.service;

import com.transactx.api.domain.*;
import com.transactx.api.dto.AtmDto;
import com.transactx.api.exception.*;
import com.transactx.api.repository.AccountRepository;
import com.transactx.api.repository.AtmMachineRepository;
import com.transactx.api.repository.LedgerEntryRepository;
import com.transactx.api.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AtmServiceImpl implements AtmService {

    private static final Logger log = LoggerFactory.getLogger(AtmServiceImpl.class);
    private static final BigDecimal DAILY_WITHDRAWAL_LIMIT = new BigDecimal("1000.00");
    private static final BigDecimal MINIMUM_BALANCE = new BigDecimal("10.00");

    private final AtmMachineRepository atmMachineRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final AuditService auditService;

    public AtmServiceImpl(
            AtmMachineRepository atmMachineRepository,
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            LedgerEntryRepository ledgerEntryRepository,
            AuditService auditService) {
        this.atmMachineRepository = atmMachineRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public AtmDto.TransactionResponse withdraw(AtmDto.WithdrawRequest request, String ipAddress, String device) {
        UUID atmId = request.getAtmId();
        String accNum = request.getAccountNumber();
        BigDecimal amount = request.getAmount();

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Withdrawal amount must be greater than zero");
        }

        // ATM withdrawal amount must be a multiple of 10
        if (amount.intValueExact() % 10 != 0) {
            throw new InvalidTransactionException("Withdrawal amount must be a multiple of ₹10");
        }

        // Lock both ATM and Account (Lock ATM first, then Account to keep lock ordering consistent)
        AtmMachine atm = atmMachineRepository.findByIdWithPessimisticLock(atmId)
                .orElseThrow(() -> new ResourceNotFoundException("ATM not found"));

        Account account = accountRepository.findByAccountNumberWithPessimisticLock(accNum)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        // Validations
        if ("FROZEN".equals(account.getStatus())) {
            throw new AccountFrozenException("Account is frozen: " + accNum);
        }

        if (account.getBalance().subtract(amount).compareTo(MINIMUM_BALANCE) < 0) {
            throw new InsufficientBalanceException("Insufficient balance. Must maintain minimum balance of " + MINIMUM_BALANCE);
        }

        // Daily Limit Check
        LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
        BigDecimal todayWithdrawals = transactionRepository.findByAccountId(account.getId(), Pageable.unpaged()).stream()
                .filter(tx -> tx.getType() == TransactionType.WITHDRAWAL 
                        && tx.getStatus() == TransactionStatus.SUCCESS 
                        && tx.getCreatedAt().isAfter(startOfDay))
                .map(Transaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (todayWithdrawals.add(amount).compareTo(DAILY_WITHDRAWAL_LIMIT) > 0) {
            throw new InvalidTransactionException("Daily withdrawal limit of ₹" + DAILY_WITHDRAWAL_LIMIT + " exceeded. Today's withdrawals: ₹" + todayWithdrawals);
        }

        // ATM Cash Check
        if (atm.getCashBalance().compareTo(amount) < 0) {
            throw new AtmOutOfCashException("ATM has insufficient physical cash balance");
        }

        // Denomination Dispensing Simulation (Change-making algorithm)
        Map<String, Integer> atmDenoms = new HashMap<>(atm.getDenominations());
        Map<String, Integer> dispensed = dispenseBills(amount.intValue(), atmDenoms);

        // Update ATM
        atm.setDenominations(atmDenoms);
        atm.setCashBalance(atm.getCashBalance().subtract(amount));
        atmMachineRepository.save(atm);

        // Update Account
        BigDecimal beforeBalance = account.getBalance();
        account.setBalance(beforeBalance.subtract(amount));
        accountRepository.save(account);

        String transactionRef = "TX-ATM-W-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);

        // Create Ledger Entry
        LedgerEntry ledgerEntry = LedgerEntry.builder()
                .transactionRef(transactionRef)
                .account(account)
                .entryType("DEBIT")
                .amount(amount)
                .balanceSnapshot(account.getBalance())
                .build();
        ledgerEntryRepository.save(ledgerEntry);

        // Create Transaction
        Transaction tx = Transaction.builder()
                .transactionRef(transactionRef)
                .account(account)
                .user(account.getUser())
                .atmMachine(atm)
                .type(TransactionType.WITHDRAWAL)
                .status(TransactionStatus.SUCCESS)
                .beforeBalance(beforeBalance)
                .afterBalance(account.getBalance())
                .amount(amount)
                .build();
        Transaction saved = transactionRepository.save(tx);

        auditService.log(
                account.getUser().getId(),
                "ATM_WITHDRAWAL",
                ipAddress,
                device,
                Map.of("amount", amount, "dispensedBills", dispensed),
                Map.of("newBalance", account.getBalance(), "atmRemainingCash", atm.getCashBalance()),
                transactionRef
        );

        return mapToResponse(saved, accNum);
    }

    @Override
    @Transactional
    public AtmDto.TransactionResponse deposit(AtmDto.DepositRequest request, String ipAddress, String device) {
        String accNum = request.getAccountNumber();
        BigDecimal amount = request.getAmount();
        UUID atmId = request.getAtmId();

        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidTransactionException("Deposit amount must be greater than zero");
        }

        Account account = accountRepository.findByAccountNumberWithPessimisticLock(accNum)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if ("FROZEN".equals(account.getStatus())) {
            throw new AccountFrozenException("Account is frozen: " + accNum);
        }

        AtmMachine atm = null;
        if (atmId != null) {
            atm = atmMachineRepository.findByIdWithPessimisticLock(atmId)
                    .orElseThrow(() -> new ResourceNotFoundException("ATM not found"));
            
            // Simulating physical bill deposit into ATM cash pool
            Map<String, Integer> atmDenoms = new HashMap<>(atm.getDenominations());
            Map<String, Integer> depositedDenoms = request.getDenominations();
            if (depositedDenoms != null) {
                int validatedAmount = 0;
                for (Map.Entry<String, Integer> entry : depositedDenoms.entrySet()) {
                    int noteVal = Integer.parseInt(entry.getKey());
                    int noteCount = entry.getValue();
                    if (noteCount < 0) {
                        throw new InvalidTransactionException("Note count cannot be negative");
                    }
                    validatedAmount += noteVal * noteCount;
                    atmDenoms.put(entry.getKey(), atmDenoms.getOrDefault(entry.getKey(), 0) + noteCount);
                }
                if (validatedAmount != amount.intValue()) {
                    throw new InvalidTransactionException("Denominations total (₹" + validatedAmount + ") does not match deposit amount (₹" + amount + ")");
                }
            } else {
                // If denominations map is missing, reject or fallback to default distribution (e.g. all in ₹100s)
                int amountVal = amount.intValue();
                if (amountVal % 100 == 0) {
                    atmDenoms.put("100", atmDenoms.getOrDefault("100", 0) + (amountVal / 100));
                } else {
                    throw new InvalidTransactionException("Denominations must be explicitly provided for deposits not matching multiples of ₹100");
                }
            }
            
            atm.setDenominations(atmDenoms);
            atm.setCashBalance(atm.getCashBalance().add(amount));
            atmMachineRepository.save(atm);
        }

        // Update Account
        BigDecimal beforeBalance = account.getBalance();
        account.setBalance(beforeBalance.add(amount));
        accountRepository.save(account);

        String transactionRef = "TX-ATM-D-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 8);

        // Create Ledger Entry
        LedgerEntry ledgerEntry = LedgerEntry.builder()
                .transactionRef(transactionRef)
                .account(account)
                .entryType("CREDIT")
                .amount(amount)
                .balanceSnapshot(account.getBalance())
                .build();
        ledgerEntryRepository.save(ledgerEntry);

        // Create Transaction Log
        Transaction tx = Transaction.builder()
                .transactionRef(transactionRef)
                .account(account)
                .user(account.getUser())
                .atmMachine(atm)
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .beforeBalance(beforeBalance)
                .afterBalance(account.getBalance())
                .amount(amount)
                .build();
        Transaction saved = transactionRepository.save(tx);

        auditService.log(
                account.getUser().getId(),
                "ATM_DEPOSIT",
                ipAddress,
                device,
                Map.of("amount", amount),
                Map.of("newBalance", account.getBalance(), "atmRemainingCash", atm != null ? atm.getCashBalance() : "N/A"),
                transactionRef
        );

        return mapToResponse(saved, accNum);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal balanceInquiry(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        return account.getBalance();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AtmDto.TransactionResponse> getMiniStatement(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());
        return transactionRepository.findByAccountId(account.getId(), pageable).stream()
                .map(tx -> mapToResponse(tx, accountNumber))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AtmDto.AtmMachineResponse> getAllAtms() {
        return atmMachineRepository.findAll().stream()
                .map(this::mapToAtmResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AtmDto.AtmMachineResponse getAtmDetails(UUID atmId) {
        AtmMachine atm = atmMachineRepository.findById(atmId)
                .orElseThrow(() -> new ResourceNotFoundException("ATM not found"));
        return mapToAtmResponse(atm);
    }

    @Override
    @Transactional
    public AtmDto.AtmMachineResponse refillAtm(UUID atmId, Map<String, Integer> denominations) {
        AtmMachine atm = atmMachineRepository.findByIdWithPessimisticLock(atmId)
                .orElseThrow(() -> new ResourceNotFoundException("ATM not found"));

        Map<String, Integer> currentDenoms = new HashMap<>(atm.getDenominations());
        int addedValue = 0;
        for (Map.Entry<String, Integer> entry : denominations.entrySet()) {
            int noteVal = Integer.parseInt(entry.getKey());
            int count = entry.getValue();
            if (count < 0) {
                throw new InvalidTransactionException("Cannot add negative bills");
            }
            addedValue += noteVal * count;
            currentDenoms.put(entry.getKey(), currentDenoms.getOrDefault(entry.getKey(), 0) + count);
        }

        atm.setDenominations(currentDenoms);
        atm.setCashBalance(atm.getCashBalance().add(new BigDecimal(addedValue)));
        AtmMachine updated = atmMachineRepository.save(atm);

        auditService.log(
                null,
                "ATM_REFILLED",
                "0.0.0.0",
                "SYSTEM",
                Map.of("refillAmount", addedValue),
                Map.of("newAtmCashBalance", updated.getCashBalance()),
                null
        );

        return mapToAtmResponse(updated);
    }

    // Bill Dispenser change-making algorithm (Deducts bills dynamically from atmDenoms)
    private Map<String, Integer> dispenseBills(int amount, Map<String, Integer> atmDenoms) {
        int remaining = amount;
        int[] noteDenoms = {100, 50, 20, 10};
        Map<String, Integer> dispensed = new HashMap<>();

        for (int note : noteDenoms) {
            String noteKey = String.valueOf(note);
            int available = atmDenoms.getOrDefault(noteKey, 0);
            if (available > 0 && remaining >= note) {
                int needed = remaining / note;
                int actualToDispense = Math.min(needed, available);
                if (actualToDispense > 0) {
                    remaining -= actualToDispense * note;
                    atmDenoms.put(noteKey, available - actualToDispense);
                    dispensed.put(noteKey, actualToDispense);
                }
            }
        }

        if (remaining > 0) {
            throw new AtmOutOfCashException("ATM cannot dispense this exact amount (₹" + amount + ") with current bill combination. Available: ₹100: " + atmDenoms.getOrDefault("100", 0) + ", ₹50: " + atmDenoms.getOrDefault("50", 0) + ", ₹20: " + atmDenoms.getOrDefault("20", 0) + ", ₹10: " + atmDenoms.getOrDefault("10", 0));
        }

        return dispensed;
    }

    private AtmDto.TransactionResponse mapToResponse(Transaction tx, String accountNumber) {
        return AtmDto.TransactionResponse.builder()
                .id(tx.getId())
                .transactionRef(tx.getTransactionRef())
                .accountNumber(accountNumber)
                .type(tx.getType().name())
                .status(tx.getStatus().name())
                .beforeBalance(tx.getBeforeBalance())
                .afterBalance(tx.getAfterBalance())
                .amount(tx.getAmount())
                .timestamp(tx.getCreatedAt())
                .build();
    }

    private AtmDto.AtmMachineResponse mapToAtmResponse(AtmMachine atm) {
        return AtmDto.AtmMachineResponse.builder()
                .id(atm.getId())
                .name(atm.getName())
                .location(atm.getLocation())
                .cashBalance(atm.getCashBalance())
                .denominations(atm.getDenominations())
                .status(atm.getStatus())
                .build();
    }
}
