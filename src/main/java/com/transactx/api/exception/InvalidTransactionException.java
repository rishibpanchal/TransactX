package com.transactx.api.exception;

import org.springframework.http.HttpStatus;

public class InvalidTransactionException extends BankException {
    public InvalidTransactionException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
