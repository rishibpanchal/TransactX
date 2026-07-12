package com.transactx.api.domain;

public enum TransactionType {
    DEPOSIT,
    WITHDRAWAL,
    TRANSFER_OUT,
    TRANSFER_IN,
    REVERSAL,
    ROLLBACK,
    FEE_DEDUCTION,
    INTEREST_CREDIT
}
