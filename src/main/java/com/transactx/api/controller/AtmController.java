package com.transactx.api.controller;

import com.transactx.api.dto.AtmDto;
import com.transactx.api.service.AtmService;
import com.transactx.api.service.TransferService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/atm")
@Tag(name = "ATM Operations", description = "Endpoints for simulating physical ATM tasks, including withdrawals, deposits, and transfers")
@SecurityRequirement(name = "bearerAuth")
public class AtmController {

    private final AtmService atmService;
    private final TransferService transferService;

    public AtmController(AtmService atmService, TransferService transferService) {
        this.atmService = atmService;
        this.transferService = transferService;
    }

    @PostMapping("/withdraw")
    @Operation(summary = "Perform a cash withdrawal simulation from a selected ATM machine")
    public ResponseEntity<AtmDto.TransactionResponse> withdraw(
            @Valid @RequestBody AtmDto.WithdrawRequest request,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        String device = servletRequest.getHeader("User-Agent");
        return ResponseEntity.ok(atmService.withdraw(request, ip, device));
    }

    @PostMapping("/deposit")
    @Operation(summary = "Simulate a cash deposit into a specific account, adding bills to the ATM's pool")
    public ResponseEntity<AtmDto.TransactionResponse> deposit(
            @Valid @RequestBody AtmDto.DepositRequest request,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        String device = servletRequest.getHeader("User-Agent");
        return ResponseEntity.ok(atmService.deposit(request, ip, device));
    }

    @PostMapping("/transfer")
    @Operation(summary = "Transfer money to another bank account, selecting locking mode")
    public ResponseEntity<AtmDto.TransactionResponse> transfer(
            @Valid @RequestBody AtmDto.TransferRequest request,
            @RequestParam(defaultValue = "PESSIMISTIC") String lockingType,
            Principal principal,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        String device = servletRequest.getHeader("User-Agent");
        return ResponseEntity.ok(transferService.transfer(request, lockingType, principal.getName(), ip, device));
    }

    @GetMapping("/balance")
    @Operation(summary = "Perform an account balance inquiry")
    public ResponseEntity<BigDecimal> getBalance(@RequestParam String accountNumber) {
        return ResponseEntity.ok(atmService.balanceInquiry(accountNumber));
    }

    @GetMapping("/statement")
    @Operation(summary = "Fetch the mini-statement containing the last 10 transactions of an account")
    public ResponseEntity<List<AtmDto.TransactionResponse>> getMiniStatement(@RequestParam String accountNumber) {
        return ResponseEntity.ok(atmService.getMiniStatement(accountNumber));
    }

    @GetMapping("/machines")
    @Operation(summary = "List all ATM machines and their locations")
    public ResponseEntity<List<AtmDto.AtmMachineResponse>> getAllAtms() {
        return ResponseEntity.ok(atmService.getAllAtms());
    }

    @GetMapping("/machines/{atmId}")
    @Operation(summary = "Retrieve bill levels and status for a single ATM machine")
    public ResponseEntity<AtmDto.AtmMachineResponse> getAtmDetails(@PathVariable UUID atmId) {
        return ResponseEntity.ok(atmService.getAtmDetails(atmId));
    }

    @PostMapping("/machines/{atmId}/refill")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Refill the cash cassette denominations in an ATM (Requires MANAGER/ADMIN privilege)")
    public ResponseEntity<AtmDto.AtmMachineResponse> refillAtm(
            @PathVariable UUID atmId,
            @RequestBody Map<String, Integer> denominations) {
        return ResponseEntity.ok(atmService.refillAtm(atmId, denominations));
    }
}
