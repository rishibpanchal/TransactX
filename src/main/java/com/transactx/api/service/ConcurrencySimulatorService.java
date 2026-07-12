package com.transactx.api.service;

import com.transactx.api.dto.AdminDto;
import java.math.BigDecimal;

public interface ConcurrencySimulatorService {
    AdminDto.LockTestResultResponse runSimulation(String srcAccNum, String destAccNum, 
                                                 BigDecimal amount, int totalRequests, String lockingType);
}
