package com.transactx.api.repository;

import com.transactx.api.domain.LedgerEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface LedgerEntryRepository extends JpaRepository<LedgerEntry, UUID> {
    List<LedgerEntry> findByTransactionRef(String transactionRef);
    Page<LedgerEntry> findByAccountId(UUID accountId, Pageable pageable);
}
