package com.transactx.api.exception;

import org.springframework.http.HttpStatus;

public class AtmOutOfCashException extends BankException {
    public AtmOutOfCashException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}
