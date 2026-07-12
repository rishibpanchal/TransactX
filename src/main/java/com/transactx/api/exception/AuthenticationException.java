package com.transactx.api.exception;

import org.springframework.http.HttpStatus;

public class AuthenticationException extends BankException {
    public AuthenticationException(String message) {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}
