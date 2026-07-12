package com.transactx.api.service;

import com.transactx.api.domain.*;
import com.transactx.api.dto.AtmDto;
import com.transactx.api.exception.AtmOutOfCashException;
import com.transactx.api.exception.InsufficientBalanceException;
import com.transactx.api.repository.AccountRepository;
import com.transactx.api.repository.AtmMachineRepository;
import com.transactx.api.repository.LedgerEntryRepository;
import com.transactx.api.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AtmServiceTest {

    @Mock
    private AtmMachineRepository atmMachineRepository;
    @Mock
    private AccountRepository accountRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private LedgerEntryRepository ledgerEntryRepository;
    @Mock
    private AuditService auditService;

    @InjectMocks
    private AtmServiceImpl atmService;

    private User user;
    private Account account;
    private AtmMachine atmMachine;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .username("rishi")
                .fullName("Rishi Kumar")
                .build();

        account = Account.builder()
                .id(UUID.randomUUID())
                .user(user)
                .accountNumber("TX1111111111")
                .balance(new BigDecimal("1000.00"))
                .status("ACTIVE")
                .build();

        Map<String, Integer> denoms = new HashMap<>();
        denoms.put("100", 10); // $1000
        denoms.put("50", 10);  // $500
        denoms.put("20", 10);  // $200
        denoms.put("10", 10);  // $100
        // Total cash = $1800

        atmMachine = AtmMachine.builder()
                .id(UUID.randomUUID())
                .name("ATM-001")
                .location("Main Branch")
                .cashBalance(new BigDecimal("1800.00"))
                .denominations(denoms)
                .status("ACTIVE")
                .build();

        lenient().when(transactionRepository.findByAccountId(any(UUID.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(org.springframework.data.domain.Page.empty());
    }

    @Test
    void withdraw_Success() {
        AtmDto.WithdrawRequest request = AtmDto.WithdrawRequest.builder()
                .accountNumber("TX1111111111")
                .amount(new BigDecimal("230.00")) // 2x100, 0x50, 1x20, 1x10
                .atmId(atmMachine.getId())
                .build();

        when(atmMachineRepository.findByIdWithPessimisticLock(atmMachine.getId())).thenReturn(Optional.of(atmMachine));
        when(accountRepository.findByAccountNumberWithPessimisticLock("TX1111111111")).thenReturn(Optional.of(account));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AtmDto.TransactionResponse response = atmService.withdraw(request, "127.0.0.1", "JUNIT");

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals(new BigDecimal("770.00"), account.getBalance());
        assertEquals(new BigDecimal("1570.00"), atmMachine.getCashBalance());
        assertEquals(8, atmMachine.getDenominations().get("100")); // 10 - 2
        assertEquals(9, atmMachine.getDenominations().get("20"));  // 10 - 1
        assertEquals(9, atmMachine.getDenominations().get("10"));  // 10 - 1

        verify(ledgerEntryRepository, times(1)).save(any(LedgerEntry.class));
        verify(transactionRepository, times(1)).save(any(Transaction.class));
    }

    @Test
    void withdraw_InsufficientAccountBalance_ThrowsException() {
        AtmDto.WithdrawRequest request = AtmDto.WithdrawRequest.builder()
                .accountNumber("TX1111111111")
                .amount(new BigDecimal("1000.00")) // leaves $0, minimum balance is $10
                .atmId(atmMachine.getId())
                .build();

        when(atmMachineRepository.findByIdWithPessimisticLock(atmMachine.getId())).thenReturn(Optional.of(atmMachine));
        when(accountRepository.findByAccountNumberWithPessimisticLock("TX1111111111")).thenReturn(Optional.of(account));

        assertThrows(InsufficientBalanceException.class, () -> 
                atmService.withdraw(request, "127.0.0.1", "JUNIT")
        );
    }

    @Test
    void withdraw_AtmCannotDispenseCombination_ThrowsException() {
        // ATM only has $100 bills left
        atmMachine.getDenominations().put("100", 10);
        atmMachine.getDenominations().put("50", 0);
        atmMachine.getDenominations().put("20", 0);
        atmMachine.getDenominations().put("10", 0);
        atmMachine.setCashBalance(new BigDecimal("1000.00"));

        AtmDto.WithdrawRequest request = AtmDto.WithdrawRequest.builder()
                .accountNumber("TX1111111111")
                .amount(new BigDecimal("150.00")) // Needs $50 or $10s which are 0
                .atmId(atmMachine.getId())
                .build();

        when(atmMachineRepository.findByIdWithPessimisticLock(atmMachine.getId())).thenReturn(Optional.of(atmMachine));
        when(accountRepository.findByAccountNumberWithPessimisticLock("TX1111111111")).thenReturn(Optional.of(account));

        assertThrows(AtmOutOfCashException.class, () -> 
                atmService.withdraw(request, "127.0.0.1", "JUNIT")
        );
    }
}
