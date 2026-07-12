package com.transactx.api.service;

import com.transactx.api.dto.AtmDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface AtmService {
    AtmDto.TransactionResponse withdraw(AtmDto.WithdrawRequest request, String ipAddress, String device);
    AtmDto.TransactionResponse deposit(AtmDto.DepositRequest request, String ipAddress, String device);
    BigDecimal balanceInquiry(String accountNumber);
    List<AtmDto.TransactionResponse> getMiniStatement(String accountNumber);
    
    // ATM Machine administration
    List<AtmDto.AtmMachineResponse> getAllAtms();
    AtmDto.AtmMachineResponse getAtmDetails(UUID atmId);
    AtmDto.AtmMachineResponse refillAtm(UUID atmId, java.util.Map<String, Integer> denominations);
}
