package com.transactx.api.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "atm_machines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtmMachine {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 150)
    private String location;

    @Column(name = "cash_balance", nullable = false, precision = 15, scale = 2)
    private BigDecimal cashBalance;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Integer> denominations;

    @Column(nullable = false, length = 20)
    private String status; // ACTIVE, OUT_OF_SERVICE

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
