package com.transactx.api.service;

import com.transactx.api.domain.Account;
import com.transactx.api.domain.User;
import com.transactx.api.dto.AccountDto;
import com.transactx.api.exception.ResourceNotFoundException;
import com.transactx.api.exception.InvalidTransactionException;
import com.transactx.api.repository.AccountRepository;
import com.transactx.api.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AccountServiceImpl implements AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final SecureRandom random = new SecureRandom();

    public AccountServiceImpl(
            AccountRepository accountRepository,
            UserRepository userRepository,
            AuditService auditService) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @Override
    @Transactional
    public AccountDto.AccountResponse createAccount(String username, AccountDto.CreateAccountRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String accountNumber = generateUniqueAccountNumber();

        Account account = Account.builder()
                .user(user)
                .accountNumber(accountNumber)
                .balance(request.getInitialBalance())
                .status("ACTIVE")
                .build();

        Account saved = accountRepository.save(account);

        auditService.log(
                user.getId(),
                "ACCOUNT_CREATED",
                "0.0.0.0",
                "SYSTEM",
                null,
                Map.of("accountNumber", accountNumber, "initialBalance", request.getInitialBalance()),
                null
        );

        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AccountDto.AccountResponse getAccountDetails(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with number: " + accountNumber));
        return mapToResponse(account);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountDto.AccountResponse> getUserAccounts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return accountRepository.findByUserId(user.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AccountDto.AccountResponse freezeAccount(String accountNumber, boolean freeze, String ip, String device) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        String oldStatus = account.getStatus();
        String newStatus = freeze ? "FROZEN" : "ACTIVE";

        if (oldStatus.equals(newStatus)) {
            throw new InvalidTransactionException("Account is already in " + newStatus + " status");
        }

        account.setStatus(newStatus);
        Account updated = accountRepository.save(account);

        auditService.log(
                account.getUser().getId(),
                freeze ? "ACCOUNT_FROZEN" : "ACCOUNT_ACTIVATED",
                ip,
                device,
                Map.of("status", oldStatus),
                Map.of("status", newStatus),
                null
        );

        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getAccountBalance(String accountNumber) {
        Account account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        return account.getBalance();
    }

    private String generateUniqueAccountNumber() {
        String accountNumber;
        do {
            // Generate a 10-digit random number
            long rawNum = 1000000000L + random.nextLong(9000000000L);
            accountNumber = "TX" + rawNum;
        } while (accountRepository.findByAccountNumber(accountNumber).isPresent());
        
        return accountNumber;
    }

    private AccountDto.AccountResponse mapToResponse(Account account) {
        return AccountDto.AccountResponse.builder()
                .id(account.getId())
                .userId(account.getUser().getId())
                .accountNumber(account.getAccountNumber())
                .balance(account.getBalance())
                .status(account.getStatus())
                .version(account.getVersion())
                .build();
    }
}
