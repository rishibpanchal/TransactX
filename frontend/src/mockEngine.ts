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
  accountType: string; // 'Checking' | 'Savings' | 'Payroll' | 'Escrow' | 'Treasury Vault'
  ownerName: string;
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
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'FEE' | 'REVERSAL' | 'SALARY_CREDIT' | 'INTEREST_CREDIT';
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

const STORAGE_KEY = 'transactx_database_v3';

// Rich Initial Seed Data
function getInitialSeed(): DatabaseSchema {
  const uCustomer1 = 'u-customer1-jane-doe';
  const uCustomer2 = 'u-customer2-john-smith';
  const uCustomer3 = 'u-customer3-alex-rivera';
  const uCustomer4 = 'u-customer4-priya-sharma';
  const uCustomer5 = 'u-customer5-marcus-vance';
  const uAdmin1 = 'u-admin1-supervisor';

  const acc1Id = 'acc-1111111111';
  const acc2Id = 'acc-1111111112';
  const acc3Id = 'acc-1111111113';
  const acc4Id = 'acc-2222222222';
  const acc5Id = 'acc-2222222223';
  const acc6Id = 'acc-3333333331';
  const acc7Id = 'acc-4444444441';
  const acc8Id = 'acc-5555555551';
  const acc9Id = 'acc-9999999991';
  const acc10Id = 'acc-9999999992';

  const atm1Id = 'b3c2a6f2-1d5b-4395-926b-193c04f98144';
  const atm2Id = 'c4d3b7a1-2e6c-5406-037c-204d15e09255';
  const atm3Id = 'd5e4c8b2-3f7d-6517-148d-315e26f10366';

  const now = new Date();
  const past = (mins: number) => new Date(now.getTime() - mins * 60000).toISOString();

  const users: UserEntity[] = [
    {
      id: uCustomer1,
      username: 'customer1',
      passwordHash: 'password',
      email: 'customer1@transactx.com',
      fullName: 'Jane Doe',
      roles: ['ROLE_CUSTOMER'],
      accountLocked: false,
      failedLoginAttempts: 0,
    },
    {
      id: uCustomer2,
      username: 'customer2',
      passwordHash: 'password',
      email: 'customer2@transactx.com',
      fullName: 'John Smith',
      roles: ['ROLE_CUSTOMER'],
      accountLocked: false,
      failedLoginAttempts: 0,
    },
    {
      id: uCustomer3,
      username: 'customer3',
      passwordHash: 'password',
      email: 'alex.rivera@transactx.com',
      fullName: 'Alex Rivera',
      roles: ['ROLE_CUSTOMER'],
      accountLocked: false,
      failedLoginAttempts: 0,
    },
    {
      id: uCustomer4,
      username: 'customer4',
      passwordHash: 'password',
      email: 'priya.sharma@transactx.com',
      fullName: 'Priya Sharma',
      roles: ['ROLE_CUSTOMER'],
      accountLocked: false,
      failedLoginAttempts: 0,
    },
    {
      id: uCustomer5,
      username: 'customer5',
      passwordHash: 'password',
      email: 'marcus.vance@transactx.com',
      fullName: 'Marcus Vance',
      roles: ['ROLE_CUSTOMER'],
      accountLocked: false,
      failedLoginAttempts: 0,
    },
    {
      id: uAdmin1,
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
      userId: uCustomer1,
      accountNumber: 'TX1111111111',
      accountType: 'Primary Checking',
      ownerName: 'Jane Doe',
      balance: 47000.0,
      status: 'ACTIVE',
      version: 4,
      createdAt: past(240),
    },
    {
      id: acc2Id,
      userId: uCustomer1,
      accountNumber: 'TX1111111112',
      accountType: 'High-Yield Savings',
      ownerName: 'Jane Doe',
      balance: 125000.0,
      status: 'ACTIVE',
      version: 2,
      createdAt: past(200),
    },
    {
      id: acc3Id,
      userId: uCustomer1,
      accountNumber: 'TX1111111113',
      accountType: 'Wealth Portfolio',
      ownerName: 'Jane Doe',
      balance: 350000.0,
      status: 'ACTIVE',
      version: 1,
      createdAt: past(180),
    },
    {
      id: acc4Id,
      userId: uCustomer2,
      accountNumber: 'TX2222222222',
      accountType: 'Retail Checking',
      ownerName: 'John Smith',
      balance: 32000.0,
      status: 'ACTIVE',
      version: 3,
      createdAt: past(220),
    },
    {
      id: acc5Id,
      userId: uCustomer2,
      accountNumber: 'TX2222222223',
      accountType: 'Emergency Reserve',
      ownerName: 'John Smith',
      balance: 85000.0,
      status: 'ACTIVE',
      version: 1,
      createdAt: past(190),
    },
    {
      id: acc6Id,
      userId: uCustomer3,
      accountNumber: 'TX3333333331',
      accountType: 'Global Traveler Checking',
      ownerName: 'Alex Rivera',
      balance: 64500.0,
      status: 'ACTIVE',
      version: 2,
      createdAt: past(160),
    },
    {
      id: acc7Id,
      userId: uCustomer4,
      accountNumber: 'TX4444444441',
      accountType: 'Tech Corp Corporate Payroll',
      ownerName: 'Priya Sharma',
      balance: 420000.0,
      status: 'ACTIVE',
      version: 5,
      createdAt: past(150),
    },
    {
      id: acc8Id,
      userId: uCustomer5,
      accountNumber: 'TX5555555551',
      accountType: 'Commercial Escrow Account',
      ownerName: 'Marcus Vance',
      balance: 215000.0,
      status: 'ACTIVE',
      version: 2,
      createdAt: past(140),
    },
    {
      id: acc9Id,
      userId: uAdmin1,
      accountNumber: 'TX9999999991',
      accountType: 'Central Core Liquidity Vault',
      ownerName: 'TransactX Treasury',
      balance: 1500000.0,
      status: 'ACTIVE',
      version: 1,
      createdAt: past(300),
    },
    {
      id: acc10Id,
      userId: uAdmin1,
      accountNumber: 'TX9999999992',
      accountType: 'ATM Terminal Float Reserve',
      ownerName: 'TransactX Treasury',
      balance: 750000.0,
      status: 'ACTIVE',
      version: 1,
      createdAt: past(300),
    },
  ];

  const atms: AtmEntity[] = [
    {
      id: atm1Id,
      name: 'Main Street Core Branch ATM',
      location: 'New Delhi, IN',
      cashBalance: 50000.0,
      denominations: { '100': 200, '50': 200, '20': 500, '10': 1000 },
      status: 'ACTIVE',
    },
    {
      id: atm2Id,
      name: 'Metro International Airport Terminal 3 ATM',
      location: 'Mumbai, IN',
      cashBalance: 120000.0,
      denominations: { '100': 600, '50': 600, '20': 1000, '10': 1000 },
      status: 'ACTIVE',
    },
    {
      id: atm3Id,
      name: 'Cyber City Tech Park ATM',
      location: 'Bengaluru, IN',
      cashBalance: 80000.0,
      denominations: { '100': 400, '50': 400, '20': 500, '10': 1000 },
      status: 'ACTIVE',
    },
  ];

  const tx1 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const tx2 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const tx3 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const tx4 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const tx5 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const tx6 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const tx7 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const tx8 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const tx9 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
  const tx10 = 'TX-REF-' + crypto.randomUUID().slice(0, 15);

  const transactions: TransactionEntity[] = [
    {
      id: crypto.randomUUID(),
      transactionRef: tx1,
      accountId: acc1Id,
      accountNumber: 'TX1111111111',
      userId: uCustomer1,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      beforeBalance: 0.0,
      afterBalance: 50000.0,
      amount: 50000.0,
      description: 'Initial Salary Deposit',
      createdAt: past(200),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx2,
      accountId: acc2Id,
      accountNumber: 'TX1111111112',
      userId: uCustomer1,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      beforeBalance: 0.0,
      afterBalance: 120000.0,
      amount: 120000.0,
      description: 'Fixed Deposit Maturity Credit',
      createdAt: past(190),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx3,
      accountId: acc2Id,
      accountNumber: 'TX1111111112',
      userId: uCustomer1,
      type: 'INTEREST_CREDIT',
      status: 'SUCCESS',
      beforeBalance: 120000.0,
      afterBalance: 125000.0,
      amount: 5000.0,
      description: 'Quarterly High-Yield Interest Payment',
      createdAt: past(60),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx4,
      accountId: acc3Id,
      accountNumber: 'TX1111111113',
      userId: uCustomer1,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      beforeBalance: 0.0,
      afterBalance: 350000.0,
      amount: 350000.0,
      description: 'Mutual Fund Dividend Reinvestment',
      createdAt: past(170),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx5,
      accountId: acc1Id,
      accountNumber: 'TX1111111111',
      userId: uCustomer1,
      type: 'TRANSFER_OUT',
      status: 'SUCCESS',
      beforeBalance: 50000.0,
      afterBalance: 48000.0,
      amount: 2000.0,
      description: 'Fund Transfer to John Smith (TX2222222222)',
      createdAt: past(120),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx5,
      accountId: acc4Id,
      accountNumber: 'TX2222222222',
      userId: uCustomer2,
      type: 'TRANSFER_IN',
      status: 'SUCCESS',
      beforeBalance: 30000.0,
      afterBalance: 32000.0,
      amount: 2000.0,
      description: 'Fund Transfer from Jane Doe (TX1111111111)',
      createdAt: past(120),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx6,
      accountId: acc1Id,
      accountNumber: 'TX1111111111',
      userId: uCustomer1,
      atmId: atm1Id,
      type: 'WITHDRAWAL',
      status: 'SUCCESS',
      beforeBalance: 48000.0,
      afterBalance: 47000.0,
      amount: 1000.0,
      description: 'Cash Withdrawal at Main Street Core Branch ATM',
      createdAt: past(45),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx7,
      accountId: acc7Id,
      accountNumber: 'TX4444444441',
      userId: uCustomer4,
      type: 'SALARY_CREDIT',
      status: 'SUCCESS',
      beforeBalance: 20000.0,
      afterBalance: 420000.0,
      amount: 400000.0,
      description: 'Monthly Corporate Payroll Inward Wire',
      createdAt: past(90),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx8,
      accountId: acc8Id,
      accountNumber: 'TX5555555551',
      userId: uCustomer5,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      beforeBalance: 15000.0,
      afterBalance: 215000.0,
      amount: 200000.0,
      description: 'Real Estate Deal Escrow Retention',
      createdAt: past(80),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx9,
      accountId: acc6Id,
      accountNumber: 'TX3333333331',
      userId: uCustomer3,
      atmId: atm2Id,
      type: 'WITHDRAWAL',
      status: 'SUCCESS',
      beforeBalance: 70000.0,
      afterBalance: 64500.0,
      amount: 5500.0,
      description: 'Airport ATM Currency Dispense',
      createdAt: past(35),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx10,
      accountId: acc9Id,
      accountNumber: 'TX9999999991',
      userId: uAdmin1,
      type: 'DEPOSIT',
      status: 'SUCCESS',
      beforeBalance: 0.0,
      afterBalance: 1500000.0,
      amount: 1500000.0,
      description: 'Central Core Banking Liquidity Allocation',
      createdAt: past(290),
    },
  ];

  const ledgers: LedgerEntryEntity[] = [
    {
      id: crypto.randomUUID(),
      transactionRef: tx1,
      accountId: acc1Id,
      entryType: 'CREDIT',
      amount: 50000.0,
      balanceSnapshot: 50000.0,
      createdAt: past(200),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx2,
      accountId: acc2Id,
      entryType: 'CREDIT',
      amount: 120000.0,
      balanceSnapshot: 120000.0,
      createdAt: past(190),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx3,
      accountId: acc2Id,
      entryType: 'CREDIT',
      amount: 5000.0,
      balanceSnapshot: 125000.0,
      createdAt: past(60),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx5,
      accountId: acc1Id,
      entryType: 'DEBIT',
      amount: 2000.0,
      balanceSnapshot: 48000.0,
      createdAt: past(120),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx5,
      accountId: acc4Id,
      entryType: 'CREDIT',
      amount: 2000.0,
      balanceSnapshot: 32000.0,
      createdAt: past(120),
    },
    {
      id: crypto.randomUUID(),
      transactionRef: tx6,
      accountId: acc1Id,
      entryType: 'DEBIT',
      amount: 1000.0,
      balanceSnapshot: 47000.0,
      createdAt: past(45),
    },
  ];

  const auditLogs: AuditLogEntity[] = [
    {
      id: crypto.randomUUID(),
      userId: uCustomer1,
      username: 'customer1',
      action: 'ACCOUNT_OPENED',
      ipAddress: '127.0.0.1',
      device: 'Mozilla Chrome (Windows)',
      newValues: { accountNumber: 'TX1111111111', accountType: 'Primary Checking', initialBalance: 50000.0 },
      transactionRef: tx1,
      createdAt: past(200),
    },
    {
      id: crypto.randomUUID(),
      userId: uCustomer1,
      username: 'customer1',
      action: 'NEW_ACCOUNT_CREATED',
      ipAddress: '127.0.0.1',
      device: 'Mozilla Chrome (Windows)',
      newValues: { accountNumber: 'TX1111111112', accountType: 'High-Yield Savings', initialBalance: 120000.0 },
      transactionRef: tx2,
      createdAt: past(190),
    },
    {
      id: crypto.randomUUID(),
      userId: uCustomer1,
      username: 'customer1',
      action: 'FUND_TRANSFER',
      ipAddress: '127.0.0.1',
      device: 'Mozilla Safari (iOS)',
      oldValues: { sourceAccount: 'TX1111111111', amount: 2000.0 },
      newValues: { destinationAccount: 'TX2222222222', newBalance: 48000.0 },
      transactionRef: tx5,
      createdAt: past(120),
    },
    {
      id: crypto.randomUUID(),
      userId: uCustomer1,
      username: 'customer1',
      action: 'ATM_WITHDRAWAL',
      ipAddress: '127.0.0.1',
      device: 'Main Street ATM #01',
      newValues: { atmId: atm1Id, amount: 1000.0 },
      transactionRef: tx6,
      createdAt: past(45),
    },
    {
      id: crypto.randomUUID(),
      userId: uCustomer4,
      username: 'customer4',
      action: 'CORPORATE_PAYROLL_POSTING',
      ipAddress: '192.168.1.104',
      device: 'Enterprise Banking Gateway',
      newValues: { accountNumber: 'TX4444444441', amount: 400000.0 },
      transactionRef: tx7,
      createdAt: past(90),
    },
  ];

  return {
    users,
    accounts,
    atms,
    transactions,
    ledgers,
    auditLogs,
    version: 3,
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
        if (parsed && parsed.accounts && parsed.accounts.length >= 8) {
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
    return this.db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public findUserById(id: string): UserEntity | undefined {
    return this.db.users.find((u) => u.id === id);
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

    const accNum = 'TX' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const newAcc: AccountEntity = {
      id: 'acc-' + crypto.randomUUID(),
      userId: newUser.id,
      accountNumber: accNum,
      accountType: 'Primary Checking',
      ownerName: fullName,
      balance: 10000.0,
      status: 'ACTIVE',
      version: 0,
      createdAt: new Date().toISOString(),
    };
    this.db.accounts.push(newAcc);

    const txRef = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
    this.db.transactions.unshift({
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
      description: 'Account Opening Welcome Bonus',
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
    // Also update ownerName on user's accounts
    this.db.accounts.forEach((a) => {
      if (a.userId === userId) a.ownerName = fullName;
    });
    this.addAuditLog(userId, u.username, 'PROFILE_UPDATED', '127.0.0.1', 'TransactX Web Client', undefined, { fullName, email });
    this.save();
    return u;
  }

  // --- Accounts operations ---
  public getAllAccounts(): AccountEntity[] {
    return this.db.accounts;
  }

  public getAccountsForUser(userId: string): AccountEntity[] {
    const user = this.findUserById(userId);
    // If admin or manager, give access to all system accounts so admin dashboard has full power
    if (user && (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_MANAGER'))) {
      return this.db.accounts;
    }
    return this.db.accounts.filter((a) => a.userId === userId);
  }

  public findAccountByNumber(accountNumber: string): AccountEntity | undefined {
    return this.db.accounts.find((a) => a.accountNumber === accountNumber);
  }

  public createAccount(userId: string, initialBalance: number, accountType: string = 'Secondary Checking'): AccountEntity {
    const user = this.findUserById(userId);
    const accNum = 'TX' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const newAcc: AccountEntity = {
      id: 'acc-' + crypto.randomUUID(),
      userId,
      accountNumber: accNum,
      accountType,
      ownerName: user?.fullName || 'Valued Customer',
      balance: initialBalance,
      status: 'ACTIVE',
      version: 0,
      createdAt: new Date().toISOString(),
    };
    this.db.accounts.push(newAcc);

    if (initialBalance > 0) {
      const txRef = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
      this.db.transactions.unshift({
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
        description: 'New Account Initial Funding',
        createdAt: new Date().toISOString(),
      });
      this.db.ledgers.unshift({
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
      accountType,
    });

    this.save();
    return newAcc;
  }

  // --- ATM operations ---
  public getAtms(): AtmEntity[] {
    return JSON.parse(JSON.stringify(this.db.atms));
  }

  public findAtmById(id: string): AtmEntity | undefined {
    return this.db.atms.find((a) => a.id === id);
  }

  public withdrawCash(accountNumber: string, amount: number, atmId: string, user: UserEntity): any {
    const acc = this.findAccountByNumber(accountNumber);
    if (!acc) throw new Error('Account not found: ' + accountNumber);
    if (acc.balance < amount) throw new Error('Insufficient balance in account: current balance is ₹' + acc.balance.toFixed(2));

    const atm = this.findAtmById(atmId) || this.db.atms[0];
    if (atm.cashBalance < amount) throw new Error('ATM machine has insufficient cash reserve (Available: ₹' + atm.cashBalance.toFixed(2) + ')');

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
      throw new Error('Unable to dispense exact cash amount with current cassette notes');
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

    this.addAuditLog(user.id, user.username, 'ATM_WITHDRAWAL', '127.0.0.1', atm.name, undefined, {
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

    this.addAuditLog(user.id, user.username, 'ATM_DEPOSIT', '127.0.0.1', atm.name, undefined, {
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
      description: `Transfer to ${dest.ownerName} (${destAccNum})`,
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
      description: `Transfer from ${src.ownerName} (${sourceAccNum})`,
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
      message: `Transferred ₹${amount.toFixed(2)} to ${dest.ownerName} (${destAccNum}) successfully`,
      timestamp: now,
    };
  }

  public getMiniStatement(accountNumber: string): TransactionEntity[] {
    return this.db.transactions
      .filter((t) => t.accountNumber === accountNumber)
      .slice(0, 25);
  }

  // --- Admin operations ---
  public getAdminStats(): any {
    const totalCustomers = this.db.users.filter((u) => u.roles.includes('ROLE_CUSTOMER')).length;
    const totalAccounts = this.db.accounts.length;
    const totalTransactions = this.db.transactions.length;
    const failedTransactions = this.db.transactions.filter((t) => t.status === 'FAILED').length;

    const largestTransactions = this.db.transactions
      .slice()
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((t) => ({
        transactionRef: t.transactionRef,
        accountNumber: t.accountNumber,
        amount: t.amount,
        type: t.type,
      }));

    return {
      totalCustomers,
      totalAccounts,
      totalTransactions,
      failedTransactions,
      avgResponseTimeMs: 16,
      cacheStats: {
        Provider: 'Upstash / In-Memory Redis Engine',
        'Active Sessions Cached': 5,
        'OTP TTL Store': 'Active',
      },
      largestTransactions,
      accounts: this.db.accounts,
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
      const successRate = 0.18 + Math.random() * 0.08;
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
          'Under heavy write contention, version checking (@Version) stops parallel threads from corrupting state. Conflicting transactions fail fast with OptimisticLockingFailureException, guaranteeing total ACID integrity.',
      };
    } else {
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
      logs = logs.filter((l) => l.action.toLowerCase() === action.toLowerCase());
    }
    if (username) {
      logs = logs.filter((l) => l.username?.toLowerCase().includes(username.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(
        (l) =>
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
        .map((l) => `"${l.id}","${l.createdAt}","${l.action}","${l.username || ''}","${l.ipAddress}","${l.device}","${l.transactionRef || ''}"`)
        .join('\n');
      return new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    } else {
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
