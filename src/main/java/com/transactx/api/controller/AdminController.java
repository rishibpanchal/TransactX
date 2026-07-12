package com.transactx.api.controller;

import com.transactx.api.domain.AuditLog;
import com.transactx.api.dto.AdminDto;
import com.transactx.api.dto.AtmDto;
import com.transactx.api.repository.AccountRepository;
import com.transactx.api.repository.TransactionRepository;
import com.transactx.api.repository.UserRepository;
import com.transactx.api.service.AuditService;
import com.transactx.api.service.ConcurrencySimulatorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin & Systems Management", description = "Dashboard statistics, locking simulator, and file exporters for operations")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AuditService auditService;
    private final ConcurrencySimulatorService concurrencySimulatorService;

    public AdminController(
            UserRepository userRepository,
            AccountRepository accountRepository,
            TransactionRepository transactionRepository,
            AuditService auditService,
            ConcurrencySimulatorService concurrencySimulatorService) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.auditService = auditService;
        this.concurrencySimulatorService = concurrencySimulatorService;
    }

    @GetMapping("/stats")
    @Operation(summary = "Retrieve high-level dashboard metrics for the system dashboard")
    public ResponseEntity<AdminDto.SystemStatsResponse> getSystemStats() {
        long totalCustomers = userRepository.count();
        long activeAccounts = accountRepository.count(); // Simplified for simulation
        long totalTx = transactionRepository.count();
        
        long failedTx = transactionRepository.findAll().stream()
                .filter(t -> "FAILED".equals(t.getStatus().name()))
                .count();

        // Query top 5 largest transaction records
        List<AtmDto.TransactionResponse> largest = transactionRepository.findAll(
                PageRequest.of(0, 5, Sort.by("amount").descending())
        ).getContent().stream()
                .map(t -> AtmDto.TransactionResponse.builder()
                        .id(t.getId())
                        .transactionRef(t.getTransactionRef())
                        .accountNumber(t.getAccount() != null ? t.getAccount().getAccountNumber() : "N/A")
                        .type(t.getType().name())
                        .status(t.getStatus().name())
                        .beforeBalance(t.getBeforeBalance())
                        .afterBalance(t.getAfterBalance())
                        .amount(t.getAmount())
                        .timestamp(t.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        Map<String, String> cacheStats = new HashMap<>();
        cacheStats.put("Provider", "Upstash Redis Free");
        cacheStats.put("Active Sessions Cached", "Enabled");
        cacheStats.put("Rate Limiting Cache", "Active");

        AdminDto.SystemStatsResponse stats = AdminDto.SystemStatsResponse.builder()
                .totalCustomers(totalCustomers)
                .activeAccounts(activeAccounts)
                .totalTransactions(totalTx)
                .failedTransactions(failedTx)
                .avgResponseTimeMs(28.4) // Simulated backend API avg response
                .cacheStats(cacheStats)
                .serverHealth("UP")
                .largestTransactions(largest)
                .build();

        return ResponseEntity.ok(stats);
    }

    @PostMapping("/concurrency-test")
    @Operation(summary = "Run high-concurrency simulation of parallel transfers, contrasting locking engines")
    public ResponseEntity<AdminDto.LockTestResultResponse> runConcurrencyTest(
            @RequestParam String sourceAccountNumber,
            @RequestParam String destinationAccountNumber,
            @RequestParam BigDecimal amount,
            @RequestParam int totalRequests,
            @RequestParam String lockingType) {
        
        AdminDto.LockTestResultResponse result = concurrencySimulatorService.runSimulation(
                sourceAccountNumber, destinationAccountNumber, amount, totalRequests, lockingType
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/audit")
    @Operation(summary = "Query and search audit logs with pagination and filters")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        return ResponseEntity.ok(auditService.getLogs(search, action, username, page, size, sortBy, sortDir));
    }

    @GetMapping("/audit/export/{format}")
    @Operation(summary = "Export full audit logs as a downloadable file (csv, xls, pdf)")
    public ResponseEntity<InputStreamResource> exportAuditLogs(
            @PathVariable String format,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String username) {
        
        ByteArrayInputStream stream;
        String filename = "audit_report_" + System.currentTimeMillis();
        MediaType mediaType;

        switch (format.toLowerCase()) {
            case "csv":
                stream = auditService.exportCSV(search, action, username);
                filename += ".csv";
                mediaType = MediaType.parseMediaType("text/csv");
                break;
            case "xls":
            case "xlsx":
                stream = auditService.exportExcel(search, action, username);
                filename += ".xlsx";
                mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                break;
            case "pdf":
                stream = auditService.exportPDF(search, action, username);
                filename += ".pdf";
                mediaType = MediaType.APPLICATION_PDF;
                break;
            default:
                throw new IllegalArgumentException("Unsupported file format: " + format);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=" + filename);

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(mediaType)
                .body(new InputStreamResource(stream));
    }
}
