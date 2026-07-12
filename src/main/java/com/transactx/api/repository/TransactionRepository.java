package com.transactx.api.repository;

import com.transactx.api.domain.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {
    Optional<Transaction> findByTransactionRef(String transactionRef);
    Page<Transaction> findByAccountId(UUID accountId, Pageable pageable);
    Page<Transaction> findByUserId(UUID userId, Pageable pageable);
}
