package com.transactx.api.exception;

import org.springframework.http.HttpStatus;

public class InsufficientBalanceException extends BankException {
    public InsufficientBalanceException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
