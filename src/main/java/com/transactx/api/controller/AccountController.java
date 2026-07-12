package com.transactx.api.controller;

import com.transactx.api.dto.AccountDto;
import com.transactx.api.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@Tag(name = "Account Management", description = "Endpoints for bank account creation, balance checks, and lifecycle states")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    @Operation(summary = "Create a new bank account with an initial balance")
    public ResponseEntity<AccountDto.AccountResponse> createAccount(
            @Valid @RequestBody AccountDto.CreateAccountRequest request,
            Principal principal) {
        return ResponseEntity.ok(accountService.createAccount(principal.getName(), request));
    }

    @GetMapping("/my")
    @Operation(summary = "Retrieve all bank accounts associated with the logged-in customer")
    public ResponseEntity<List<AccountDto.AccountResponse>> getMyAccounts(Principal principal) {
        return ResponseEntity.ok(accountService.getUserAccounts(principal.getName()));
    }

    @GetMapping("/{accountNumber}")
    @Operation(summary = "Retrieve specific details and balance of a bank account")
    public ResponseEntity<AccountDto.AccountResponse> getAccountDetails(@PathVariable String accountNumber) {
        return ResponseEntity.ok(accountService.getAccountDetails(accountNumber));
    }

    @PutMapping("/{accountNumber}/freeze")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @Operation(summary = "Freeze or unfreeze a customer account (Requires MANAGER/ADMIN privilege)")
    public ResponseEntity<AccountDto.AccountResponse> freezeAccount(
            @PathVariable String accountNumber,
            @RequestParam boolean freeze,
            HttpServletRequest servletRequest) {
        String ip = servletRequest.getRemoteAddr();
        String device = servletRequest.getHeader("User-Agent");
        return ResponseEntity.ok(accountService.freezeAccount(accountNumber, freeze, ip, device));
    }
}
