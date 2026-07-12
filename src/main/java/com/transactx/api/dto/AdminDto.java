package com.transactx.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AdminDto {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SystemStatsResponse {
        private long totalCustomers;
        private long activeAccounts;
        private long totalTransactions;
        private long failedTransactions;
        private double avgResponseTimeMs;
        private Map<String, String> cacheStats;
        private String serverHealth;
        private List<AtmDto.TransactionResponse> largestTransactions;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LockTestResultResponse {
        private String lockingType; // OPTIMISTIC or PESSIMISTIC
        private long durationMs;
        private int totalRequests;
        private int successfulRequests;
        private int failedRequests;
        private BigDecimal finalBalance;
        private String explanation;
    }
}
