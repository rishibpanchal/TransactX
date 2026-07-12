package com.transactx.api.service;

import com.transactx.api.dto.AdminDto;
import com.transactx.api.dto.AtmDto;
import com.transactx.api.repository.AccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class ConcurrencySimulatorServiceImpl implements ConcurrencySimulatorService {

    private static final Logger log = LoggerFactory.getLogger(ConcurrencySimulatorServiceImpl.class);

    private final TransferService transferService;
    private final AccountRepository accountRepository;

    public ConcurrencySimulatorServiceImpl(TransferService transferService, AccountRepository accountRepository) {
        this.transferService = transferService;
        this.accountRepository = accountRepository;
    }

    @Override
    public AdminDto.LockTestResultResponse runSimulation(String srcAccNum, String destAccNum, 
                                                         BigDecimal amount, int totalRequests, String lockingType) {
        
        log.info("Starting concurrency test of {} requests with {} locking...", totalRequests, lockingType);
        
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        long startTime = System.currentTimeMillis();

        // Using Java Virtual Threads for lightweight high-concurrency simulation
        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<Future<Void>> futures = new ArrayList<>();

            for (int i = 0; i < totalRequests; i++) {
                final int index = i;
                futures.add(executor.submit(() -> {
                    // Create an individual transfer request
                    AtmDto.TransferRequest transferRequest = AtmDto.TransferRequest.builder()
                            .sourceAccountNumber(srcAccNum)
                            .destinationAccountNumber(destAccNum)
                            .amount(amount)
                            .idempotencyKey("CONC-LOCK-" + lockingType + "-" + index + "-" + UUID.randomUUID())
                            .build();

                    try {
                        // Trigger transfer through the service (handles db transactions & locking)
                        transferService.transfer(transferRequest, lockingType, "admin", "127.0.0.1", "CONCURRENCY_TESTER");
                        successCount.incrementAndGet();
                    } catch (Exception e) {
                        log.debug("Concurrent transaction failed: {}", e.getMessage());
                        failureCount.incrementAndGet();
                    }
                    return null;
                }));
            }

            // Wait for all tasks to complete
            for (Future<Void> future : futures) {
                try {
                    future.get();
                } catch (Exception e) {
                    log.error("Error waiting for concurrent thread", e);
                }
            }
        }

        long durationMs = System.currentTimeMillis() - startTime;

        // Fetch final balance to show comparison
        BigDecimal finalBalance = accountRepository.findByAccountNumber(srcAccNum)
                .map(com.transactx.api.domain.Account::getBalance)
                .orElse(BigDecimal.ZERO);

        String explanation;
        if ("OPTIMISTIC".equalsIgnoreCase(lockingType)) {
            explanation = "Optimistic Locking uses JPA version columns (@Version) to prevent lost updates. " +
                    "If two threads load and edit the same account version, the first commits and increments version, " +
                    "while the second fails with ObjectOptimisticLockingFailureException, triggering rollback. " +
                    "This creates high throughput but returns higher transactional failure rates under high write contention.";
        } else {
            explanation = "Pessimistic Locking uses DB write-locks (SELECT FOR UPDATE) that serialize transactions. " +
                    "Threads are blocked until the locking transaction commits/rolls back. " +
                    "This ensures 100% transactional success rates for viable balances at the expense of average response latency.";
        }

        return AdminDto.LockTestResultResponse.builder()
                .lockingType(lockingType.toUpperCase())
                .durationMs(durationMs)
                .totalRequests(totalRequests)
                .successfulRequests(successCount.get())
                .failedRequests(failureCount.get())
                .finalBalance(finalBalance)
                .explanation(explanation)
                .build();
    }
}
