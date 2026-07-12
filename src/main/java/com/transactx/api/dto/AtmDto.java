package com.transactx.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

public class AtmDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WithdrawRequest {
        @NotBlank(message = "Account number is required")
        private String accountNumber;

        @NotNull(message = "Amount is required")
        @Positive(message = "Withdrawal amount must be positive")
        private BigDecimal amount;

        @NotNull(message = "ATM ID is required")
        private UUID atmId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepositRequest {
        @NotBlank(message = "Account number is required")
        private String accountNumber;

        @NotNull(message = "Amount is required")
        @Positive(message = "Deposit amount must be positive")
        private BigDecimal amount;

        private UUID atmId; // Optional if online deposit

        private Map<String, Integer> denominations; // Denominations deposited (e.g., {"10": 5, "100": 2})
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransferRequest {
        @NotBlank(message = "Source account number is required")
        private String sourceAccountNumber;

        @NotBlank(message = "Destination account number is required")
        private String destinationAccountNumber;

        @NotNull(message = "Amount is required")
        @Positive(message = "Transfer amount must be positive")
        private BigDecimal amount;

        @NotBlank(message = "Idempotency key is required")
        private String idempotencyKey;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionResponse {
        private UUID id;
        private String transactionRef;
        private String accountNumber;
        private String type;
        private String status;
        private BigDecimal beforeBalance;
        private BigDecimal afterBalance;
        private BigDecimal amount;
        private LocalDateTime timestamp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AtmMachineResponse {
        private UUID id;
        private String name;
        private String location;
        private BigDecimal cashBalance;
        private Map<String, Integer> denominations;
        private String status;
    }
}
