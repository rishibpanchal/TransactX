package com.transactx.api.service;

import com.transactx.api.dto.AtmDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.transactx.api.domain.Transaction;
import java.util.UUID;

public interface TransferService {
    AtmDto.TransactionResponse transfer(AtmDto.TransferRequest request, String lockingType, 
                                        String username, String ipAddress, String device);
    
    Page<Transaction> getTransactionHistory(String accountNumber, Pageable pageable);
    
    Page<Transaction> getUserTransactionHistory(UUID userId, Pageable pageable);
}
