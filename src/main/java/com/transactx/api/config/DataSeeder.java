package com.transactx.api.config;

import com.transactx.api.domain.*;
import com.transactx.api.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AccountRepository accountRepository;
    private final AtmMachineRepository atmMachineRepository;
    private final TransactionRepository transactionRepository;
    private final LedgerEntryRepository ledgerEntryRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, RoleRepository roleRepository,
                      AccountRepository accountRepository, AtmMachineRepository atmMachineRepository,
                      TransactionRepository transactionRepository, LedgerEntryRepository ledgerEntryRepository,
                      AuditLogRepository auditLogRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.accountRepository = accountRepository;
        this.atmMachineRepository = atmMachineRepository;
        this.transactionRepository = transactionRepository;
        this.ledgerEntryRepository = ledgerEntryRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.existsByUsername("customer1") || transactionRepository.count() > 0) {
            // Data seeder already executed previously
            return;
        }

        // 1. Retrieve Roles (baseline inserted by migration)
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseGet(() -> roleRepository.save(new Role(UUID.randomUUID(), "ROLE_CUSTOMER")));
        Role managerRole = roleRepository.findByName("ROLE_MANAGER")
                .orElseGet(() -> roleRepository.save(new Role(UUID.randomUUID(), "ROLE_MANAGER")));
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
                .orElseGet(() -> roleRepository.save(new Role(UUID.randomUUID(), "ROLE_ADMIN")));

        // 2. Provision Demo Profiles
        User customer1 = User.builder()
                .username("customer1")
                .passwordHash(passwordEncoder.encode("password"))
                .email("customer1@transactx.com")
                .fullName("Jane Doe")
                .roles(Set.of(customerRole))
                .build();
        userRepository.save(customer1);

        User customer2 = User.builder()
                .username("customer2")
                .passwordHash(passwordEncoder.encode("password"))
                .email("customer2@transactx.com")
                .fullName("John Smith")
                .roles(Set.of(customerRole))
                .build();
        userRepository.save(customer2);

        User admin1 = User.builder()
                .username("admin1")
                .passwordHash(passwordEncoder.encode("password"))
                .email("admin1@transactx.com")
                .fullName("Supervisor Admin")
                .roles(Set.of(adminRole, managerRole))
                .build();
        userRepository.save(admin1);

        // 3. Provision Demo Accounts
        Account acc1 = Account.builder()
                .accountNumber("TX1111111111")
                .balance(new BigDecimal("50000.00"))
                .status("ACTIVE")
                .user(customer1)
                .version(0)
                .build();
        accountRepository.save(acc1);

        Account acc2 = Account.builder()
                .accountNumber("TX2222222222")
                .balance(new BigDecimal("30000.00"))
                .status("ACTIVE")
                .user(customer2)
                .version(0)
                .build();
        accountRepository.save(acc2);

        // 4. Provision ATM Terminal Cassette Reserves
        Map<String, Integer> denoms = new HashMap<>();
        denoms.put("100", 100);
        denoms.put("50", 100);
        denoms.put("20", 200);
        denoms.put("10", 500);

        AtmMachine atm = AtmMachine.builder()
                .name("Main Street Core Branch ATM")
                .location("New Delhi, IN")
                .cashBalance(new BigDecimal("24000.00"))
                .denominations(denoms)
                .status("ACTIVE")
                .build();
        atmMachineRepository.save(atm);

        // 5. Seed Core Ledger Events
        // Log event 1: Customer 1 initial deposit
        String txRef1 = "TX-REF-" + UUID.randomUUID().toString().substring(0, 15);
        Transaction tx1 = Transaction.builder()
                .transactionRef(txRef1)
                .account(acc1)
                .user(customer1)
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .beforeBalance(BigDecimal.ZERO)
                .afterBalance(new BigDecimal("50000.00"))
                .amount(new BigDecimal("50000.00"))
                .build();
        transactionRepository.save(tx1);

        LedgerEntry le1 = LedgerEntry.builder()
                .transactionRef(txRef1)
                .account(acc1)
                .entryType("CREDIT")
                .amount(new BigDecimal("50000.00"))
                .balanceSnapshot(new BigDecimal("50000.00"))
                .build();
        ledgerEntryRepository.save(le1);

        AuditLog al1 = AuditLog.builder()
                .user(customer1)
                .action("ACCOUNT_OPENED")
                .ipAddress("127.0.0.1")
                .device("Mozilla Chrome (Windows)")
                .newValues(Map.of("accountNumber", "TX1111111111", "initialBalance", 50000.00))
                .transactionRef(txRef1)
                .build();
        auditLogRepository.save(al1);

        // Log event 2: Customer 2 initial deposit
        String txRef2 = "TX-REF-" + UUID.randomUUID().toString().substring(0, 15);
        Transaction tx2 = Transaction.builder()
                .transactionRef(txRef2)
                .account(acc2)
                .user(customer2)
                .type(TransactionType.DEPOSIT)
                .status(TransactionStatus.SUCCESS)
                .beforeBalance(BigDecimal.ZERO)
                .afterBalance(new BigDecimal("30000.00"))
                .amount(new BigDecimal("30000.00"))
                .build();
        transactionRepository.save(tx2);

        LedgerEntry le2 = LedgerEntry.builder()
                .transactionRef(txRef2)
                .account(acc2)
                .entryType("CREDIT")
                .amount(new BigDecimal("30000.00"))
                .balanceSnapshot(new BigDecimal("30000.00"))
                .build();
        ledgerEntryRepository.save(le2);

        AuditLog al2 = AuditLog.builder()
                .user(customer2)
                .action("ACCOUNT_OPENED")
                .ipAddress("127.0.0.1")
                .device("Mozilla Chrome (Windows)")
                .newValues(Map.of("accountNumber", "TX2222222222", "initialBalance", 30000.00))
                .transactionRef(txRef2)
                .build();
        auditLogRepository.save(al2);

        // Log event 3: Fund transfer credit/debit leg
        String txRef3 = "TX-REF-" + UUID.randomUUID().toString().substring(0, 15);
        Transaction tx3Out = Transaction.builder()
                .transactionRef(txRef3)
                .account(acc1)
                .user(customer1)
                .type(TransactionType.TRANSFER_OUT)
                .status(TransactionStatus.SUCCESS)
                .beforeBalance(new BigDecimal("50000.00"))
                .afterBalance(new BigDecimal("48000.00"))
                .amount(new BigDecimal("2000.00"))
                .build();
        transactionRepository.save(tx3Out);

        LedgerEntry le3Debit = LedgerEntry.builder()
                .transactionRef(txRef3)
                .account(acc1)
                .entryType("DEBIT")
                .amount(new BigDecimal("2000.00"))
                .balanceSnapshot(new BigDecimal("48000.00"))
                .build();
        ledgerEntryRepository.save(le3Debit);

        Transaction tx3In = Transaction.builder()
                .transactionRef(txRef3)
                .account(acc2)
                .user(customer2)
                .type(TransactionType.TRANSFER_IN)
                .status(TransactionStatus.SUCCESS)
                .beforeBalance(new BigDecimal("30000.00"))
                .afterBalance(new BigDecimal("32000.00"))
                .amount(new BigDecimal("2000.00"))
                .build();
        transactionRepository.save(tx3In);

        LedgerEntry le3Credit = LedgerEntry.builder()
                .transactionRef(txRef3)
                .account(acc2)
                .entryType("CREDIT")
                .amount(new BigDecimal("2000.00"))
                .balanceSnapshot(new BigDecimal("32000.00"))
                .build();
        ledgerEntryRepository.save(le3Credit);

        AuditLog al3 = AuditLog.builder()
                .user(customer1)
                .action("FUND_TRANSFER")
                .ipAddress("127.0.0.1")
                .device("Mozilla Safari (iOS)")
                .oldValues(Map.of("sourceAccount", "TX1111111111", "amount", 2000.00))
                .newValues(Map.of("destinationAccount", "TX2222222222"))
                .transactionRef(txRef3)
                .build();
        auditLogRepository.save(al3);

        // Log event 4: ATM cash withdrawal
        String txRef4 = "TX-REF-" + UUID.randomUUID().toString().substring(0, 15);
        Transaction tx4 = Transaction.builder()
                .transactionRef(txRef4)
                .account(acc1)
                .user(customer1)
                .atmMachine(atm)
                .type(TransactionType.WITHDRAWAL)
                .status(TransactionStatus.SUCCESS)
                .beforeBalance(new BigDecimal("48000.00"))
                .afterBalance(new BigDecimal("47000.00"))
                .amount(new BigDecimal("1000.00"))
                .build();
        transactionRepository.save(tx4);

        LedgerEntry le4 = LedgerEntry.builder()
                .transactionRef(txRef4)
                .account(acc1)
                .entryType("DEBIT")
                .amount(new BigDecimal("1000.00"))
                .balanceSnapshot(new BigDecimal("47000.00"))
                .build();
        ledgerEntryRepository.save(le4);

        AuditLog al4 = AuditLog.builder()
                .user(customer1)
                .action("ATM_WITHDRAWAL")
                .ipAddress("127.0.0.1")
                .device("ATM Terminal #01")
                .newValues(Map.of("atmId", atm.getId(), "amount", 1000.00))
                .transactionRef(txRef4)
                .build();
        auditLogRepository.save(al4);

        // Sync final balances in JPA
        acc1.setBalance(new BigDecimal("47000.00"));
        accountRepository.save(acc1);
        acc2.setBalance(new BigDecimal("32000.00"));
        accountRepository.save(acc2);
    }
}
