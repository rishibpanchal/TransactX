package com.transactx.api.service;

import com.transactx.api.dto.AccountDto;
import java.math.BigDecimal;
import java.util.List;

public interface AccountService {
    AccountDto.AccountResponse createAccount(String username, AccountDto.CreateAccountRequest request);
    AccountDto.AccountResponse getAccountDetails(String accountNumber);
    List<AccountDto.AccountResponse> getUserAccounts(String username);
    AccountDto.AccountResponse freezeAccount(String accountNumber, boolean freeze, String ip, String device);
    BigDecimal getAccountBalance(String accountNumber);
}
