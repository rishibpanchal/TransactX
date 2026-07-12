package com.transactx.api.repository;

import com.transactx.api.domain.AtmMachine;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.UUID;

public interface AtmMachineRepository extends JpaRepository<AtmMachine, UUID> {
    Optional<AtmMachine> findByName(String name);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AtmMachine a WHERE a.id = :id")
    Optional<AtmMachine> findByIdWithPessimisticLock(@Param("id") UUID id);
}
