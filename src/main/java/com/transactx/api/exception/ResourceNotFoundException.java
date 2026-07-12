package com.transactx.api.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends BankException {
    public ResourceNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}
