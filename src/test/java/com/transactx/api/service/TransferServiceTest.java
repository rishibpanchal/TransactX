package com.transactx.api.service;

import com.transactx.api.domain.*;
import com.transactx.api.dto.AtmDto;
import com.transactx.api.exception.InsufficientBalanceException;
import com.transactx.api.repository.AccountRepository;
import com.transactx.api.repository.LedgerEntryRepository;
import com.transactx.api.repository.TransactionRepository;
import com.transactx.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransferServiceTest {

    @Mock
    private AccountRepository accountRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private LedgerEntryRepository ledgerEntryRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AuditService auditService;
    @Mock
    private StringRedisTemplate redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private TransferServiceImpl transferService;

    private User user;
    private Account sourceAccount;
    private Account destAccount;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(UUID.randomUUID())
                .username("rishi")
                .fullName("Rishi Kumar")
                .build();

        sourceAccount = Account.builder()
                .id(UUID.randomUUID())
                .user(user)
                .accountNumber("TX1111111111")
                .balance(new BigDecimal("500.00"))
                .status("ACTIVE")
                .build();

        destAccount = Account.builder()
                .id(UUID.randomUUID())
                .user(user)
                .accountNumber("TX2222222222")
                .balance(new BigDecimal("100.00"))
                .status("ACTIVE")
                .build();
    }

    @Test
    void transfer_Success() {
        AtmDto.TransferRequest request = AtmDto.TransferRequest.builder()
                .sourceAccountNumber("TX1111111111")
                .destinationAccountNumber("TX2222222222")
                .amount(new BigDecimal("200.00"))
                .idempotencyKey("test-key")
                .build();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), anyLong(), any())).thenReturn(true);
        when(userRepository.findByUsername("rishi")).thenReturn(Optional.of(user));
        
        // Return sorted accounts appropriately
        when(accountRepository.findByAccountNumber("TX1111111111")).thenReturn(Optional.of(sourceAccount));
        when(accountRepository.findByAccountNumber("TX2222222222")).thenReturn(Optional.of(destAccount));

        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AtmDto.TransactionResponse response = transferService.transfer(
                request, "OPTIMISTIC", "rishi", "127.0.0.1", "JUNIT"
        );

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals(new BigDecimal("300.00"), sourceAccount.getBalance());
        assertEquals(new BigDecimal("300.00"), destAccount.getBalance());

        verify(ledgerEntryRepository, times(2)).save(any(LedgerEntry.class));
        verify(transactionRepository, times(2)).save(any(Transaction.class));
    }

    @Test
    void transfer_InsufficientBalance_ThrowsException() {
        AtmDto.TransferRequest request = AtmDto.TransferRequest.builder()
                .sourceAccountNumber("TX1111111111")
                .destinationAccountNumber("TX2222222222")
                .amount(new BigDecimal("600.00"))
                .idempotencyKey("test-key")
                .build();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(anyString(), anyString(), anyLong(), any())).thenReturn(true);
        when(userRepository.findByUsername("rishi")).thenReturn(Optional.of(user));
        when(accountRepository.findByAccountNumber("TX1111111111")).thenReturn(Optional.of(sourceAccount));
        when(accountRepository.findByAccountNumber("TX2222222222")).thenReturn(Optional.of(destAccount));

        assertThrows(InsufficientBalanceException.class, () -> 
                transferService.transfer(request, "OPTIMISTIC", "rishi", "127.0.0.1", "JUNIT")
        );
    }
}
