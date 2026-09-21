// TransactX Core Persistent Simulation Engine
// Provides permanent, zero-dependency banking simulation with persistent localStorage database.

export interface UserEntity {
  id: string;
  username: string;
  passwordHash: string;
  email: string;
  fullName: string;
  roles: string[];
  accountLocked: boolean;
  failedLoginAttempts: number;
}

export interface AccountEntity {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  version: number;
  createdAt: string;
}

export interface AtmEntity {
  id: string;
  name: string;
  location: string;
  cashBalance: number;
  denominations: Record<string, number>;
  status: 'ACTIVE' | 'MAINTENANCE';
}

export interface TransactionEntity {
  id: string;
  transactionRef: string;
  accountId: string;
  accountNumber: string;
  userId: string;
  atmId?: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'FEE' | 'REVERSAL';
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  beforeBalance: number;
  afterBalance: number;
  amount: number;
  description?: string;
  createdAt: string;
}

export interface LedgerEntryEntity {
  id: string;
  transactionRef: string;
  accountId: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceSnapshot: number;
  createdAt: string;
}

export interface AuditLogEntity {
  id: string;
  userId?: string;
  username?: string;
  action: string;
  ipAddress: string;
  device: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  transactionRef?: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: UserEntity[];
  accounts: AccountEntity[];
  atms: AtmEntity[];
  transactions: TransactionEntity[];
  ledgers: LedgerEntryEntity[];
  auditLogs: AuditLogEntity[];
  version: number;
}

const STORAGE_KEY = 'transactx_database_v2';

// Standard Initial Seed Data matching Spring Boot DataSeeder.java
function getInitialSeed(): DatabaseSchema {
  const customer1Id = 'u-customer1-jane-doe';
  const customer2Id = 'u-customer2-john-smith';
  const admin1Id = 'u-admin1-supervisor';

  const acc1Id = 'acc-1111111111';
  const acc2Id = 'acc-2222222222';

  const atmId = 'b3c2a6f2-1d5b-4395-926b-193c04f98144';

  const now = new Date();
  const past = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();

  const users: UserEntity[] = [
    {
      id: customer1Id,
      username: 'customer1',
      passwordHash: 'password', // Plain comparison for simulation
      email: 'customer1@transactx.com',
      fullName: 'Jane Doe',
      roles: ['ROLE_CUSTOMER'],
      accountLocked: false,
      failedLoginAttempts: 0,
    },
    {
      id: customer2Id,
      username: 'customer2',
      passwordHash: 'password',
      email: 'customer2@transactx.com',
      fullName: 'John Smith',
      roles: ['ROLE_CUSTOMER'],
      accountLocked: false,
      failedLoginAttempts: 0,
    },
    {
      id: admin1Id,
      username: 'admin1',
      passwordHash: 'password',
      email: 'admin1@transactx.com',
      fullName: 'Supervisor Admin',
      roles: ['ROLE_ADMIN', 'ROLE_MANAGER'],
      accountLocked: false,
      failedLoginAttempts: 0,
    },
  ];

  const accounts: AccountEntity[] = [
    {
      id: acc1Id,
      userId: customer1Id,
      accountNumber: 'TX1111111111',
      balance: 47000.0,
      status: 'ACTIVE',
      version: 3,
      createdAt: past(180),
    },
    {
      id: acc2Id,
      userId: customer2Id,
      accountNumber: 'TX2222222222',
      balance: 32000.0,
      status: 'ACTIVE',
      version: 2,
      createdAt: past(150),
    },
  ];

  const atms: AtmEntity[] = [
    {
      id: atmId,
      name: 'Main Street Core Branch ATM',
      location: 'New Delhi, IN',
      cashBalance: 24000.0,
      denominations: { '100': 100, '50': 100, '20': 200, '10': 500 },
      status: 'ACTIVE',
    },
  ];

  const txRef1 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const txRef2 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const txRef3 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const txRef4 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);

  const transactions: TransactionEntity[] = [
    {
      id: crypto.randomUUID(),
      transactionRef: txRef1,
      accountId: acc1Id,
      accountNumber: 'TX1111111111',
      userId: customer1Id,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      beforeBalance: 0.0,
      afterBalance: 50000.0,
      amount: 50000.0,
      description: 'Initial Account Deposit',
      createdAt: past(120),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: txRef2,
      accountId: acc2Id,
      accountNumber: 'TX2222222222',
      userId: customer2Id,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      beforeBalance: 0.0,
      afterBalance: 30000.0,
      amount: 30000.0,
      description: 'Initial Account Deposit',
      createdAt: past(100),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: txRef3,
      accountId: acc1Id,
      accountNumber: 'TX1111111111',
      userId: customer1Id,
      type: 'TRANSFER_OUT',
      status: 'SUCCESS',
      beforeBalance: 50000.0,
      afterBalance: 48000.0,
      amount: 2000.0,
      description: 'Transfer to TX2222222222',
      createdAt: past(60),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: txRef3,
      accountId: acc2Id,
      accountNumber: 'TX2222222222',
      userId: customer2Id,
      type: 'TRANSFER_IN',
      status: 'SUCCESS',
      beforeBalance: 30000.0,
      afterBalance: 32000.0,
      amount: 2000.0,
      description: 'Transfer from TX1111111111',
      createdAt: past(60),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: txRef4,
      accountId: acc1Id,
      accountNumber: 'TX1111111111',
      userId: customer1Id,
      atmId,
      type: 'WITHDRAWAL',
      status: 'SUCCESS',
      beforeBalance: 48000.0,
      afterBalance: 47000.0,
      amount: 1000.0,
      description: 'ATM Cash Withdrawal',
      createdAt: past(30),
    },
  ];

  const ledgers: LedgerEntryEntity[] = [
    {
      id: crypto.randomUUID(),
      transactionRef: txRef1,
      accountId: acc1Id,
      entryType: 'CREDIT',
      amount: 50000.0,
      balanceSnapshot: 50000.0,
      createdAt: past(120),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: txRef2,
      accountId: acc2Id,
      entryType: 'CREDIT',
      amount: 30000.0,
      balanceSnapshot: 30000.0,
      createdAt: past(100),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: txRef3,
      accountId: acc1Id,
      entryType: 'DEBIT',
      amount: 2000.0,
      balanceSnapshot: 48000.0,
      createdAt: past(60),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: txRef3,
      accountId: acc2Id,
      entryType: 'CREDIT',
      amount: 2000.0,
      balanceSnapshot: 32000.0,
      createdAt: past(60),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: txRef4,
      accountId: acc1Id,
      entryType: 'DEBIT',
      amount: 1000.0,
      balanceSnapshot: 47000.0,
      createdAt: past(30),
    },
  ];

  const auditLogs: AuditLogEntity[] = [
    {
      id: crypto.randomUUID(),
      userId: customer1Id,
      username: 'customer1',
      action: 'ACCOUNT_OPENED',
      ipAddress: '127.0.0.1',
      device: 'Mozilla Chrome (Windows)',
      newValues: { accountNumber: 'TX1111111111', initialBalance: 50000.0 },
      transactionRef: txRef1,
      createdAt: past(120),
    },
    {
      id: crypto.randomUUID(),
      userId: customer2Id,
      username: 'customer2',
      action: 'ACCOUNT_OPENED',
      ipAddress: '127.0.0.1',
      device: 'Mozilla Chrome (Windows)',
      newValues: { accountNumber: 'TX2222222222', initialBalance: 30000.0 },
      transactionRef: txRef2,
      createdAt: past(100),
    },
    {
      id: crypto.randomUUID(),
      userId: customer1Id,
      username: 'customer1',
      action: 'FUND_TRANSFER',
      ipAddress: '127.0.0.1',
      device: 'Mozilla Safari (iOS)',
      oldValues: { sourceAccount: 'TX1111111111', amount: 2000.0 },
      newValues: { destinationAccount: 'TX2222222222' },
      transactionRef: txRef3,
      createdAt: past(60),
    },
    {
      id: crypto.randomUUID(),
      userId: customer1Id,
      username: 'customer1',
      action: 'ATM_WITHDRAWAL',
      ipAddress: '127.0.0.1',
      device: 'ATM Terminal #01',
      newValues: { atmId, amount: 1000.0 },
      transactionRef: txRef4,
      createdAt: past(30),
    },
  ];

  return {
    users,
    accounts,
    atms,
    transactions,
    ledgers,
    auditLogs,
    version: 2,
  };
}

class SimulationDatabase {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.load();
  }

  private load(): DatabaseSchema {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.users && parsed.accounts && parsed.accounts.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse database from localStorage, initializing fresh', e);
    }
    const fresh = getInitialSeed();
    this.save(fresh);
    return fresh;
  }

  public save(data: DatabaseSchema = this.db) {
    this.db = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  public resetToDefault(): DatabaseSchema {
    const fresh = getInitialSeed();
    this.save(fresh);
    return fresh;
  }

  public getDb(): DatabaseSchema {
    return this.db;
  }

  // --- Auth operations ---
  public findUserByUsername(username: string): UserEntity | undefined {
    return this.db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public findUserById(id: string): UserEntity | undefined {
    return this.db.users.find(u => u.id === id);
  }

  public createUser(username: string, email: string, fullName: string, passwordHash: string): UserEntity {
    const newUser: UserEntity = {
      id: 'u-' + crypto.randomUUID(),
      username,
      email,
      fullName,
      passwordHash,
      roles: ['ROLE_CUSTOMER'],
      accountLocked: false,
      failedLoginAttempts: 0,
    };
    this.db.users.push(newUser);

    // Also auto-provision a primary bank account with ₹10,000 welcome credit
    const accNum = 'TX' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const newAcc: AccountEntity = {
      id: 'acc-' + crypto.randomUUID(),
      userId: newUser.id,
      accountNumber: accNum,
      balance: 10000.0,
      status: 'ACTIVE',
      version: 0,
      createdAt: new Date().toISOString(),
    };
    this.db.accounts.push(newAcc);

    const txRef = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
    this.db.transactions.push({
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: newAcc.id,
      accountNumber: accNum,
      userId: newUser.id,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      beforeBalance: 0,
      afterBalance: 10000.0,
      amount: 10000.0,
      description: 'Account Opening Bonus Credit',
      createdAt: new Date().toISOString(),
    });

    this.db.ledgers.push({
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: newAcc.id,
      entryType: 'CREDIT',
      amount: 10000.0,
      balanceSnapshot: 10000.0,
      createdAt: new Date().toISOString(),
    });

    this.addAuditLog(newUser.id, newUser.username, 'ACCOUNT_OPENED', '127.0.0.1', 'TransactX Portal', undefined, {
      accountNumber: accNum,
      initialBalance: 10000.0,
    }, txRef);

    this.save();
    return newUser;
  }

  public updateUserProfile(userId: string, fullName: string, email: string): UserEntity {
    const u = this.findUserById(userId);
    if (!u) throw new Error('User not found');
    u.fullName = fullName;
    u.email = email;
    this.addAuditLog(userId, u.username, 'PROFILE_UPDATED', '127.0.0.1', 'TransactX Web Client', undefined, { fullName, email });
    this.save();
    return u;
  }

  // --- Accounts operations ---
  public getAccountsForUser(userId: string): AccountEntity[] {
    return this.db.accounts.filter(a => a.userId === userId);
  }

  public findAccountByNumber(accountNumber: string): AccountEntity | undefined {
    return this.db.accounts.find(a => a.accountNumber === accountNumber);
  }

  public createAccount(userId: string, initialBalance: number): AccountEntity {
    const user = this.findUserById(userId);
    const accNum = 'TX' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const newAcc: AccountEntity = {
      id: 'acc-' + crypto.randomUUID(),
      userId,
      accountNumber: accNum,
      balance: initialBalance,
      status: 'ACTIVE',
      version: 0,
      createdAt: new Date().toISOString(),
    };
    this.db.accounts.push(newAcc);

    if (initialBalance > 0) {
      const txRef = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
      this.db.transactions.push({
        id: crypto.randomUUID(),
        transactionRef: txRef,
        accountId: newAcc.id,
        accountNumber: accNum,
        userId,
        type: 'DEPOSIT',
        status: 'SUCCESS',
        beforeBalance: 0,
        afterBalance: initialBalance,
        amount: initialBalance,
        description: 'New Account Creation Initial Funding',
        createdAt: new Date().toISOString(),
      });
      this.db.ledgers.push({
        id: crypto.randomUUID(),
        transactionRef: txRef,
        accountId: newAcc.id,
        entryType: 'CREDIT',
        amount: initialBalance,
        balanceSnapshot: initialBalance,
        createdAt: new Date().toISOString(),
      });
    }

    this.addAuditLog(userId, user?.username, 'NEW_ACCOUNT_CREATED', '127.0.0.1', 'Web App', undefined, {
      accountNumber: accNum,
      initialBalance,
    });

    this.save();
    return newAcc;
  }

  // --- ATM operations ---
  public getAtms(): AtmEntity[] {
    return this.db.atms;
  }

  public findAtmById(id: string): AtmEntity | undefined {
    return this.db.atms.find(a => a.id === id);
  }

  public withdrawCash(accountNumber: string, amount: number, atmId: string, user: UserEntity): any {
    const acc = this.findAccountByNumber(accountNumber);
    if (!acc) throw new Error('Account not found: ' + accountNumber);
    if (acc.balance < amount) throw new Error('Insufficient balance in account');

    const atm = this.findAtmById(atmId) || this.db.atms[0];
    if (atm.cashBalance < amount) throw new Error('ATM machine has insufficient cash reserve');

    // Calculate dispense denominations using greedy approach
    let remaining = amount;
    const dispensedNotes: Record<string, number> = {};
    const denoms = [100, 50, 20, 10];

    for (const d of denoms) {
      const dKey = d.toString();
      const availableNotes = atm.denominations[dKey] || 0;
      const neededNotes = Math.floor(remaining / d);
      const take = Math.min(neededNotes, availableNotes);
      if (take > 0) {
        dispensedNotes[dKey] = take;
        remaining -= take * d;
        atm.denominations[dKey] -= take;
      }
    }

    if (remaining > 0) {
      throw new Error('Unable to dispense exact requested cash amount with available cassette notes');
    }

    const beforeBal = acc.balance;
    acc.balance -= amount;
    acc.version += 1;
    atm.cashBalance -= amount;

    const txRef = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
    const tx: TransactionEntity = {
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: acc.id,
      accountNumber: acc.accountNumber,
      userId: user.id,
      atmId: atm.id,
      type: 'WITHDRAWAL',
      status: 'SUCCESS',
      beforeBalance: beforeBal,
      afterBalance: acc.balance,
      amount,
      description: `Cash withdrawal from ${atm.name}`,
      createdAt: new Date().toISOString(),
    };
    this.db.transactions.unshift(tx);

    this.db.ledgers.unshift({
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: acc.id,
      entryType: 'DEBIT',
      amount,
      balanceSnapshot: acc.balance,
      createdAt: new Date().toISOString(),
    });

    this.addAuditLog(user.id, user.username, 'ATM_WITHDRAWAL', '127.0.0.1', 'ATM Terminal #' + atm.id.slice(0, 4), undefined, {
      accountNumber,
      amount,
      dispensedNotes,
    }, txRef);

    this.save();

    return {
      transactionRef: txRef,
      accountNumber: acc.accountNumber,
      amount,
      type: 'WITHDRAWAL',
      status: 'SUCCESS',
      beforeBalance: beforeBal,
      afterBalance: acc.balance,
      dispensedDenominations: dispensedNotes,
      message: `Dispensed ₹${amount.toFixed(2)} cash from ${atm.name}`,
      timestamp: tx.createdAt,
    };
  }

  public depositCash(accountNumber: string, amount: number, atmId: string, denominations: Record<string, number>, user: UserEntity): any {
    const acc = this.findAccountByNumber(accountNumber);
    if (!acc) throw new Error('Account not found: ' + accountNumber);

    const atm = this.findAtmById(atmId) || this.db.atms[0];

    // Add notes to ATM cassette
    if (denominations) {
      for (const [k, v] of Object.entries(denominations)) {
        atm.denominations[k] = (atm.denominations[k] || 0) + (Number(v) || 0);
      }
    }
    atm.cashBalance += amount;

    const beforeBal = acc.balance;
    acc.balance += amount;
    acc.version += 1;

    const txRef = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
    const tx: TransactionEntity = {
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: acc.id,
      accountNumber: acc.accountNumber,
      userId: user.id,
      atmId: atm.id,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      beforeBalance: beforeBal,
      afterBalance: acc.balance,
      amount,
      description: `Cash deposit at ${atm.name}`,
      createdAt: new Date().toISOString(),
    };
    this.db.transactions.unshift(tx);

    this.db.ledgers.unshift({
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: acc.id,
      entryType: 'CREDIT',
      amount,
      balanceSnapshot: acc.balance,
      createdAt: new Date().toISOString(),
    });

    this.addAuditLog(user.id, user.username, 'ATM_DEPOSIT', '127.0.0.1', 'ATM Terminal #' + atm.id.slice(0, 4), undefined, {
      accountNumber,
      amount,
      denominations,
    }, txRef);

    this.save();

    return {
      transactionRef: txRef,
      accountNumber: acc.accountNumber,
      amount,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      beforeBalance: beforeBal,
      afterBalance: acc.balance,
      message: `Deposited ₹${amount.toFixed(2)} cash into account`,
      timestamp: tx.createdAt,
    };
  }

  public transferFunds(sourceAccNum: string, destAccNum: string, amount: number, user: UserEntity): any {
    if (sourceAccNum === destAccNum) {
      throw new Error('Source and destination accounts must be different');
    }
    const src = this.findAccountByNumber(sourceAccNum);
    if (!src) throw new Error(`Source account ${sourceAccNum} not found`);

    const dest = this.findAccountByNumber(destAccNum);
    if (!dest) throw new Error(`Destination account ${destAccNum} not found`);

    if (src.balance < amount) {
      throw new Error(`Insufficient funds: account has ₹${src.balance.toFixed(2)}, required ₹${amount.toFixed(2)}`);
    }

    const srcBefore = src.balance;
    const destBefore = dest.balance;

    src.balance -= amount;
    src.version += 1;
    dest.balance += amount;
    dest.version += 1;

    const txRef = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
    const now = new Date().toISOString();

    // Debit leg
    this.db.transactions.unshift({
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: src.id,
      accountNumber: src.accountNumber,
      userId: src.userId,
      type: 'TRANSFER_OUT',
      status: 'SUCCESS',
      beforeBalance: srcBefore,
      afterBalance: src.balance,
      amount,
      description: `Transfer to ${destAccNum}`,
      createdAt: now,
    });

    this.db.ledgers.unshift({
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: src.id,
      entryType: 'DEBIT',
      amount,
      balanceSnapshot: src.balance,
      createdAt: now,
    });

    // Credit leg
    this.db.transactions.unshift({
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: dest.id,
      accountNumber: dest.accountNumber,
      userId: dest.userId,
      type: 'TRANSFER_IN',
      status: 'SUCCESS',
      beforeBalance: destBefore,
      afterBalance: dest.balance,
      amount,
      description: `Transfer from ${sourceAccNum}`,
      createdAt: now,
    });

    this.db.ledgers.unshift({
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: dest.id,
      entryType: 'CREDIT',
      amount,
      balanceSnapshot: dest.balance,
      createdAt: now,
    });

    this.addAuditLog(user.id, user.username, 'FUND_TRANSFER', '127.0.0.1', 'Web Client', {
      sourceAccount: sourceAccNum,
      amount,
    }, {
      destinationAccount: destAccNum,
      newSourceBalance: src.balance,
    }, txRef);

    this.save();

    return {
      transactionRef: txRef,
      sourceAccountNumber: sourceAccNum,
      destinationAccountNumber: destAccNum,
      amount,
      type: 'TRANSFER_OUT',
      status: 'SUCCESS',
      beforeBalance: srcBefore,
      afterBalance: src.balance,
      message: `Transferred ₹${amount.toFixed(2)} to ${destAccNum} successfully`,
      timestamp: now,
    };
  }

  public getMiniStatement(accountNumber: string): TransactionEntity[] {
    return this.db.transactions
      .filter(t => t.accountNumber === accountNumber)
      .slice(0, 20);
  }

  // --- Admin operations ---
  public getAdminStats(): any {
    const totalCustomers = this.db.users.filter(u => u.roles.includes('ROLE_CUSTOMER')).length;
    const totalTransactions = this.db.transactions.length;
    const failedTransactions = this.db.transactions.filter(t => t.status === 'FAILED').length;

    const largestTransactions = this.db.transactions
      .slice()
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(t => ({
        transactionRef: t.transactionRef,
        accountNumber: t.accountNumber,
        amount: t.amount,
        type: t.type,
      }));

    return {
      totalCustomers,
      totalTransactions,
      failedTransactions,
      avgResponseTimeMs: 18,
      cacheStats: {
        Provider: 'Upstash / In-Memory Redis Engine',
        'Active Sessions Cached': 3,
        'OTP TTL Store': 'Active',
      },
      largestTransactions,
    };
  }

  public runConcurrencyTest(
    sourceAccNum: string,
    destAccNum: string,
    amount: number,
    totalRequests: number,
    lockingType: 'OPTIMISTIC' | 'PESSIMISTIC'
  ): any {
    const src = this.findAccountByNumber(sourceAccNum) || this.db.accounts[0];
    const initialBal = src.balance;

    if (lockingType === 'OPTIMISTIC') {
      // Optimistic locking simulation: heavy concurrent contention triggers OptimisticLockingFailureException
      const successRate = 0.18 + Math.random() * 0.08; // ~18-26%
      const successfulRequests = Math.max(1, Math.round(totalRequests * successRate));
      const failedRequests = totalRequests - successfulRequests;
      const totalDebited = successfulRequests * amount;
      src.balance = Math.max(0, src.balance - totalDebited);
      src.version += successfulRequests;
      this.save();

      return {
        lockingType: 'OPTIMISTIC',
        totalRequests,
        successfulRequests,
        failedRequests,
        initialBalance: initialBal,
        finalBalance: src.balance,
        durationMs: Math.round(45 + Math.random() * 30),
        explanation:
          'Under heavy write contention, version checking (@Version) stops parallel threads from corrupting state. Blocked transactions fail fast with OptimisticLockingFailureException, guaranteeing total ACID integrity.',
      };
    } else {
      // Pessimistic locking: row-level lock (SELECT FOR UPDATE) guarantees 100% sequential execution
      const affordable = Math.floor(src.balance / amount);
      const successfulRequests = Math.min(totalRequests, affordable);
      const failedRequests = totalRequests - successfulRequests;
      src.balance = Math.max(0, src.balance - successfulRequests * amount);
      src.version += successfulRequests;
      this.save();

      return {
        lockingType: 'PESSIMISTIC',
        totalRequests,
        successfulRequests,
        failedRequests,
        initialBalance: initialBal,
        finalBalance: src.balance,
        durationMs: Math.round(140 + Math.random() * 60),
        explanation:
          'Postgres row-level locking (SELECT FOR UPDATE) forces concurrent threads into strict serial ordering. All available balance operations complete with 100% consistency and zero state corruption.',
      };
    }
  }

  public getAuditLogs(page: number = 0, size: number = 15, action?: string, username?: string, search?: string): any {
    let logs = this.db.auditLogs.slice();

    if (action) {
      logs = logs.filter(l => l.action.toLowerCase() === action.toLowerCase());
    }
    if (username) {
      logs = logs.filter(l => l.username?.toLowerCase().includes(username.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(
        l =>
          l.action.toLowerCase().includes(q) ||
          l.username?.toLowerCase().includes(q) ||
          l.ipAddress.includes(q) ||
          l.device.toLowerCase().includes(q) ||
          (l.transactionRef && l.transactionRef.toLowerCase().includes(q))
      );
    }

    const totalElements = logs.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const start = page * size;
    const content = logs.slice(start, start + size);

    return {
      content,
      totalElements,
      totalPages,
      size,
      number: page,
    };
  }

  public exportAuditLogs(format: string): Blob {
    const logs = this.db.auditLogs;
    if (format === 'csv') {
      const header = 'ID,Timestamp,Action,Username,IP Address,Device,TransactionRef\n';
      const rows = logs
        .map(l => `"${l.id}","${l.createdAt}","${l.action}","${l.username || ''}","${l.ipAddress}","${l.device}","${l.transactionRef || ''}"`)
        .join('\n');
      return new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    } else {
      // JSON / formatted report
      const content = JSON.stringify(logs, null, 2);
      return new Blob([content], { type: 'application/json' });
    }
  }

  private addAuditLog(
    userId?: string,
    username?: string,
    action: string = 'UNKNOWN',
    ipAddress: string = '127.0.0.1',
    device: string = 'TransactX Web App',
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    transactionRef?: string
  ) {
    this.db.auditLogs.unshift({
      id: crypto.randomUUID(),
      userId,
      username: username || 'system',
      action,
      ipAddress,
      device,
      oldValues,
      newValues,
      transactionRef,
      createdAt: new Date().toISOString(),
    });
  }
}

// Global Singleton Instance
export const simulationDb = new SimulationDatabase();
