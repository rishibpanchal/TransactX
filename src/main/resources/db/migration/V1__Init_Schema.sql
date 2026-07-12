CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL
);

-- Table: users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    account_locked BOOLEAN DEFAULT FALSE,
    failed_login_attempts INT DEFAULT 0,
    lock_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_roles
CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Table: accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    version INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: atm_machines
CREATE TABLE atm_machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    location VARCHAR(150) NOT NULL,
    cash_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    denominations JSONB NOT NULL, -- e.g., {"10": 100, "20": 100, "50": 100, "100": 100}
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref VARCHAR(50) UNIQUE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    atm_id UUID REFERENCES atm_machines(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL, -- DEPOSIT, WITHDRAWAL, TRANSFER_OUT, TRANSFER_IN, REVERSAL, ROLLBACK, FEE, INTEREST
    status VARCHAR(20) NOT NULL, -- PENDING, PROCESSING, SUCCESS, FAILED, CANCELLED, ROLLED_BACK
    before_balance NUMERIC(15, 2) NOT NULL,
    after_balance NUMERIC(15, 2) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: ledger_entries
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref VARCHAR(50) NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    entry_type VARCHAR(10) NOT NULL, -- DEBIT, CREDIT
    amount NUMERIC(15, 2) NOT NULL,
    balance_snapshot NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    device VARCHAR(150),
    old_values JSONB,
    new_values JSONB,
    transaction_ref VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: refresh_tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE
);

-- Add Indexes for Performance & Constraints
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_accounts_number ON accounts(account_number);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_ref ON transactions(transaction_ref);
CREATE INDEX idx_ledger_ref ON ledger_entries(transaction_ref);
CREATE INDEX idx_ledger_account_id ON ledger_entries(account_id);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_refresh_token ON refresh_tokens(token);

-- Insert Default Roles
INSERT INTO roles (id, name) VALUES 
(uuid_generate_v4(), 'ROLE_CUSTOMER'),
(uuid_generate_v4(), 'ROLE_MANAGER'),
(uuid_generate_v4(), 'ROLE_ADMIN');

-- Insert Initial ATM Machine "ATM-001"
INSERT INTO atm_machines (id, name, location, cash_balance, denominations, status) VALUES
('b3c2a6f2-1d5b-4395-926b-193c04f98144', 'ATM-001', 'HQ Main Branch Lobby', 500000.00, '{"10": 1000, "20": 1000, "50": 1000, "100": 4200}', 'ACTIVE');
