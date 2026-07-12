package com.transactx.api.exception;

import org.springframework.http.HttpStatus;

public class AccountFrozenException extends BankException {
    public AccountFrozenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }
}
