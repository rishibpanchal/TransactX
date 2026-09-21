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
  accountType: string;
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

const STORAGE_KEY = 'transactx_database_v5';

// 12 Rich Accounts Across Retail, Corporate & Treasury
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
  const acc7Id = 'acc-3333333332';
  const acc8Id = 'acc-4444444441';
  const acc9Id = 'acc-4444444442';
  const acc10Id = 'acc-5555555551';
  const acc11Id = 'acc-9999999991';
  const acc12Id = 'acc-9999999992';

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
      version: 5,
      createdAt: past(300),
    },
    {
      id: acc2Id,
      userId: uCustomer1,
      accountNumber: 'TX1111111112',
      accountType: 'High-Yield Savings',
      ownerName: 'Jane Doe',
      balance: 125000.0,
      status: 'ACTIVE',
      version: 3,
      createdAt: past(280),
    },
    {
      id: acc3Id,
      userId: uCustomer1,
      accountNumber: 'TX1111111113',
      accountType: 'Wealth Investment Portfolio',
      ownerName: 'Jane Doe',
      balance: 350000.0,
      status: 'ACTIVE',
      version: 2,
      createdAt: past(260),
    },
    {
      id: acc4Id,
      userId: uCustomer2,
      accountNumber: 'TX2222222222',
      accountType: 'Retail Everyday Checking',
      ownerName: 'John Smith',
      balance: 32000.0,
      status: 'ACTIVE',
      version: 4,
      createdAt: past(290),
    },
    {
      id: acc5Id,
      userId: uCustomer2,
      accountNumber: 'TX2222222223',
      accountType: 'Emergency Reserve',
      ownerName: 'John Smith',
      balance: 85000.0,
      status: 'ACTIVE',
      version: 2,
      createdAt: past(270),
    },
    {
      id: acc6Id,
      userId: uCustomer3,
      accountNumber: 'TX3333333331',
      accountType: 'Global Traveler Checking',
      ownerName: 'Alex Rivera',
      balance: 64500.0,
      status: 'ACTIVE',
      version: 3,
      createdAt: past(250),
    },
    {
      id: acc7Id,
      userId: uCustomer3,
      accountNumber: 'TX3333333332',
      accountType: 'Forex Multi-Currency',
      ownerName: 'Alex Rivera',
      balance: 180000.0,
      status: 'ACTIVE',
      version: 2,
      createdAt: past(240),
    },
    {
      id: acc8Id,
      userId: uCustomer4,
      accountNumber: 'TX4444444441',
      accountType: 'Tech Corp Corporate Payroll',
      ownerName: 'Priya Sharma',
      balance: 420000.0,
      status: 'ACTIVE',
      version: 6,
      createdAt: past(280),
    },
    {
      id: acc9Id,
      userId: uCustomer4,
      accountNumber: 'TX4444444442',
      accountType: 'Tech Corp Operating Reserve',
      ownerName: 'Priya Sharma',
      balance: 950000.0,
      status: 'ACTIVE',
      version: 3,
      createdAt: past(260),
    },
    {
      id: acc10Id,
      userId: uCustomer5,
      accountNumber: 'TX5555555551',
      accountType: 'Commercial Escrow Account',
      ownerName: 'Marcus Vance',
      balance: 215000.0,
      status: 'ACTIVE',
      version: 3,
      createdAt: past(230),
    },
    {
      id: acc11Id,
      userId: uAdmin1,
      accountNumber: 'TX9999999991',
      accountType: 'Central Core Liquidity Vault',
      ownerName: 'TransactX Treasury',
      balance: 1500000.0,
      status: 'ACTIVE',
      version: 2,
      createdAt: past(360),
    },
    {
      id: acc12Id,
      userId: uAdmin1,
      accountNumber: 'TX9999999992',
      accountType: 'ATM Terminal Reserve Float',
      ownerName: 'TransactX Treasury',
      balance: 750000.0,
      status: 'ACTIVE',
      version: 2,
      createdAt: past(360),
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

  interface TxSpec {
    accountId: string;
    accountNumber: string;
    userId: string;
    atmId?: string;
    type: TransactionEntity['type'];
    amount: number;
    beforeBalance: number;
    afterBalance: number;
    description: string;
    daysAgo: number;
  }

  const txSpecs: TxSpec[] = [
    // --- Jane Doe: Primary Checking (TX1111111111) -> Final Balance: 47000 ---
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, type: 'SALARY_CREDIT', amount: 55000, beforeBalance: 0, afterBalance: 55000, description: 'Direct Deposit - Global Tech Inc Payroll', daysAgo: 90 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, type: 'TRANSFER_OUT', amount: 12500, beforeBalance: 55000, afterBalance: 42500, description: 'Aura Apartments Monthly Lease & Maintenance', daysAgo: 80 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, type: 'TRANSFER_OUT', amount: 3200, beforeBalance: 42500, afterBalance: 39300, description: 'Tata Power & Fiber Internet Autopay', daysAgo: 75 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, type: 'SALARY_CREDIT', amount: 55000, beforeBalance: 39300, afterBalance: 94300, description: 'Direct Deposit - Global Tech Inc Payroll', daysAgo: 60 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, type: 'TRANSFER_OUT', amount: 25000, beforeBalance: 94300, afterBalance: 69300, description: 'Transfer to High-Yield Savings (TX1111111112)', daysAgo: 55 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, type: 'TRANSFER_OUT', amount: 15000, beforeBalance: 69300, afterBalance: 54300, description: 'HDFC Regalia Credit Card Settlement', daysAgo: 45 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, type: 'SALARY_CREDIT', amount: 55000, beforeBalance: 54300, afterBalance: 109300, description: 'Direct Deposit - Global Tech Inc Payroll', daysAgo: 30 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, type: 'TRANSFER_OUT', amount: 2000, beforeBalance: 109300, afterBalance: 107300, description: 'Inter-bank Transfer to John Smith (TX2222222222)', daysAgo: 25 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, type: 'TRANSFER_OUT', amount: 55000, beforeBalance: 107300, afterBalance: 52300, description: 'Transfer to Wealth Investment Portfolio (TX1111111113)', daysAgo: 18 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, atmId: atm1Id, type: 'WITHDRAWAL', amount: 2000, beforeBalance: 52300, afterBalance: 50300, description: 'Cash Withdrawal at Main Street Core Branch ATM', daysAgo: 10 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, type: 'TRANSFER_IN', amount: 1700, beforeBalance: 50300, afterBalance: 52000, description: 'Zomato Dineout Refund & UPI Inflow', daysAgo: 5 },
    { accountId: acc1Id, accountNumber: 'TX1111111111', userId: uCustomer1, atmId: atm2Id, type: 'WITHDRAWAL', amount: 5000, beforeBalance: 52000, afterBalance: 47000, description: 'Weekend Cash Withdrawal at Terminal 3 Airport ATM', daysAgo: 2 },

    // --- Jane Doe: High-Yield Savings (TX1111111112) -> Final Balance: 125000 ---
    { accountId: acc2Id, accountNumber: 'TX1111111112', userId: uCustomer1, type: 'DEPOSIT', amount: 90000, beforeBalance: 0, afterBalance: 90000, description: 'Initial Term Savings Transfer', daysAgo: 150 },
    { accountId: acc2Id, accountNumber: 'TX1111111112', userId: uCustomer1, type: 'INTEREST_CREDIT', amount: 1800, beforeBalance: 90000, afterBalance: 91800, description: 'Quarterly Tier-1 APY Interest Credit', daysAgo: 120 },
    { accountId: acc2Id, accountNumber: 'TX1111111112', userId: uCustomer1, type: 'TRANSFER_IN', amount: 25000, beforeBalance: 91800, afterBalance: 116800, description: 'Transfer from Primary Checking (TX1111111111)', daysAgo: 90 },
    { accountId: acc2Id, accountNumber: 'TX1111111112', userId: uCustomer1, type: 'INTEREST_CREDIT', amount: 2350, beforeBalance: 116800, afterBalance: 119150, description: 'Quarterly Tier-1 APY Interest Credit', daysAgo: 60 },
    { accountId: acc2Id, accountNumber: 'TX1111111112', userId: uCustomer1, type: 'TRANSFER_IN', amount: 5000, beforeBalance: 119150, afterBalance: 124150, description: 'Automated Monthly Savings Goal', daysAgo: 30 },
    { accountId: acc2Id, accountNumber: 'TX1111111112', userId: uCustomer1, type: 'INTEREST_CREDIT', amount: 850, beforeBalance: 124150, afterBalance: 125000, description: 'Monthly Compounded Interest', daysAgo: 3 },

    // --- Jane Doe: Wealth Investment Portfolio (TX1111111113) -> Final Balance: 350000 ---
    { accountId: acc3Id, accountNumber: 'TX1111111113', userId: uCustomer1, type: 'DEPOSIT', amount: 200000, beforeBalance: 0, afterBalance: 200000, description: 'Initial Equity & Sovereign Bond Allocation', daysAgo: 200 },
    { accountId: acc3Id, accountNumber: 'TX1111111113', userId: uCustomer1, type: 'INTEREST_CREDIT', amount: 12500, beforeBalance: 200000, afterBalance: 212500, description: 'Sovereign Gold Bond Semi-Annual Coupon', daysAgo: 140 },
    { accountId: acc3Id, accountNumber: 'TX1111111113', userId: uCustomer1, type: 'TRANSFER_IN', amount: 82500, beforeBalance: 212500, afterBalance: 295000, description: 'Portfolio Inflow from Checking Account', daysAgo: 100 },
    { accountId: acc3Id, accountNumber: 'TX1111111113', userId: uCustomer1, type: 'INTEREST_CREDIT', amount: 18000, beforeBalance: 295000, afterBalance: 313000, description: 'Treasury Yield Dividend Distribution', daysAgo: 50 },
    { accountId: acc3Id, accountNumber: 'TX1111111113', userId: uCustomer1, type: 'TRANSFER_IN', amount: 37000, beforeBalance: 313000, afterBalance: 350000, description: 'Quarterly Asset Rebalancing Inward Wire', daysAgo: 15 },

    // --- John Smith: Retail Everyday Checking (TX2222222222) -> Final Balance: 32000 ---
    { accountId: acc4Id, accountNumber: 'TX2222222222', userId: uCustomer2, type: 'SALARY_CREDIT', amount: 45000, beforeBalance: 0, afterBalance: 45000, description: 'Direct Deposit - Acme Engineering Ltd', daysAgo: 90 },
    { accountId: acc4Id, accountNumber: 'TX2222222222', userId: uCustomer2, type: 'TRANSFER_OUT', amount: 10500, beforeBalance: 45000, afterBalance: 34500, description: 'City View Apartments Monthly Rent', daysAgo: 75 },
    { accountId: acc4Id, accountNumber: 'TX2222222222', userId: uCustomer2, type: 'TRANSFER_OUT', amount: 2500, beforeBalance: 34500, afterBalance: 32000, description: 'Supermarket & Grocery Card Swipe', daysAgo: 60 },
    { accountId: acc4Id, accountNumber: 'TX2222222222', userId: uCustomer2, type: 'TRANSFER_IN', amount: 2000, beforeBalance: 32000, afterBalance: 34000, description: 'Transfer from Jane Doe (TX1111111111)', daysAgo: 45 },
    { accountId: acc4Id, accountNumber: 'TX2222222222', userId: uCustomer2, type: 'SALARY_CREDIT', amount: 45000, beforeBalance: 34000, afterBalance: 79000, description: 'Direct Deposit - Acme Engineering Ltd', daysAgo: 30 },
    { accountId: acc4Id, accountNumber: 'TX2222222222', userId: uCustomer2, type: 'TRANSFER_OUT', amount: 40000, beforeBalance: 79000, afterBalance: 39000, description: 'Transfer to Emergency Reserve (TX2222222223)', daysAgo: 20 },
    { accountId: acc4Id, accountNumber: 'TX2222222222', userId: uCustomer2, atmId: atm3Id, type: 'WITHDRAWAL', amount: 4000, beforeBalance: 39000, afterBalance: 35000, description: 'Cash Withdrawal at Cyber City Tech Park ATM', daysAgo: 10 },
    { accountId: acc4Id, accountNumber: 'TX2222222222', userId: uCustomer2, type: 'TRANSFER_OUT', amount: 3000, beforeBalance: 35000, afterBalance: 32000, description: 'Fuel & Highway Toll Express Payment', daysAgo: 4 },

    // --- John Smith: Emergency Reserve (TX2222222223) -> Final Balance: 85000 ---
    { accountId: acc5Id, accountNumber: 'TX2222222223', userId: uCustomer2, type: 'DEPOSIT', amount: 40000, beforeBalance: 0, afterBalance: 40000, description: 'Emergency Safety Fund Initial Deposit', daysAgo: 180 },
    { accountId: acc5Id, accountNumber: 'TX2222222223', userId: uCustomer2, type: 'INTEREST_CREDIT', amount: 1200, beforeBalance: 40000, afterBalance: 41200, description: 'Semi-Annual High Yield Interest', daysAgo: 120 },
    { accountId: acc5Id, accountNumber: 'TX2222222223', userId: uCustomer2, type: 'TRANSFER_IN', amount: 40000, beforeBalance: 41200, afterBalance: 81200, description: 'Transfer from Everyday Checking', daysAgo: 60 },
    { accountId: acc5Id, accountNumber: 'TX2222222223', userId: uCustomer2, type: 'INTEREST_CREDIT', amount: 3800, beforeBalance: 81200, afterBalance: 85000, description: 'Quarterly Compound Growth Credit', daysAgo: 15 },

    // --- Alex Rivera: Global Traveler Checking (TX3333333331) -> Final Balance: 64500 ---
    { accountId: acc6Id, accountNumber: 'TX3333333331', userId: uCustomer3, type: 'SALARY_CREDIT', amount: 80000, beforeBalance: 0, afterBalance: 80000, description: 'Remote Engineering Stipend - CloudScale Inc', daysAgo: 100 },
    { accountId: acc6Id, accountNumber: 'TX3333333331', userId: uCustomer3, type: 'TRANSFER_OUT', amount: 8000, beforeBalance: 80000, afterBalance: 72000, description: 'Star Alliance Flight Booking', daysAgo: 80 },
    { accountId: acc6Id, accountNumber: 'TX3333333331', userId: uCustomer3, atmId: atm2Id, type: 'WITHDRAWAL', amount: 5500, beforeBalance: 72000, afterBalance: 66500, description: 'Airport ATM Currency Dispense - Terminal 3', daysAgo: 65 },
    { accountId: acc6Id, accountNumber: 'TX3333333331', userId: uCustomer3, type: 'TRANSFER_IN', amount: 6000, beforeBalance: 66500, afterBalance: 72500, description: 'Consulting Retainer Bonus', daysAgo: 40 },
    { accountId: acc6Id, accountNumber: 'TX3333333331', userId: uCustomer3, type: 'TRANSFER_OUT', amount: 6000, beforeBalance: 72500, afterBalance: 66500, description: 'Hotel Grand Marquee Lodging Wire', daysAgo: 20 },
    { accountId: acc6Id, accountNumber: 'TX3333333331', userId: uCustomer3, atmId: atm1Id, type: 'WITHDRAWAL', amount: 2000, beforeBalance: 66500, afterBalance: 64500, description: 'Metro Station ATM Cash Out', daysAgo: 5 },

    // --- Alex Rivera: Forex Multi-Currency (TX3333333332) -> Final Balance: 180000 ---
    { accountId: acc7Id, accountNumber: 'TX3333333332', userId: uCustomer3, type: 'DEPOSIT', amount: 120000, beforeBalance: 0, afterBalance: 120000, description: 'USD / EUR Hedged Foreign Exchange Inward', daysAgo: 200 },
    { accountId: acc7Id, accountNumber: 'TX3333333332', userId: uCustomer3, type: 'TRANSFER_IN', amount: 65000, beforeBalance: 120000, afterBalance: 185000, description: 'International Cross-Border Wire Settlement', daysAgo: 130 },
    { accountId: acc7Id, accountNumber: 'TX3333333332', userId: uCustomer3, type: 'FEE', amount: 5000, beforeBalance: 185000, afterBalance: 180000, description: 'Inter-Bank SWIFT Wire Transfer Processing Fee', daysAgo: 70 },

    // --- Priya Sharma: Tech Corp Corporate Payroll (TX4444444441) -> Final Balance: 420000 ---
    { accountId: acc8Id, accountNumber: 'TX4444444441', userId: uCustomer4, type: 'DEPOSIT', amount: 1200000, beforeBalance: 0, afterBalance: 1200000, description: 'Enterprise Customer Software Contract Inflow', daysAgo: 120 },
    { accountId: acc8Id, accountNumber: 'TX4444444441', userId: uCustomer4, type: 'TRANSFER_OUT', amount: 400000, beforeBalance: 1200000, afterBalance: 800000, description: 'Monthly Staff Payroll Batch Processing', daysAgo: 90 },
    { accountId: acc8Id, accountNumber: 'TX4444444441', userId: uCustomer4, type: 'TRANSFER_OUT', amount: 150000, beforeBalance: 800000, afterBalance: 650000, description: 'AWS Cloud Infrastructure Direct Debit', daysAgo: 75 },
    { accountId: acc8Id, accountNumber: 'TX4444444441', userId: uCustomer4, type: 'TRANSFER_OUT', amount: 200000, beforeBalance: 650000, afterBalance: 450000, description: 'Corporate Office Lease & Utilities', daysAgo: 60 },
    { accountId: acc8Id, accountNumber: 'TX4444444441', userId: uCustomer4, type: 'TRANSFER_IN', amount: 320000, beforeBalance: 450000, afterBalance: 770000, description: 'SaaS Enterprise Annual License Receipt', daysAgo: 40 },
    { accountId: acc8Id, accountNumber: 'TX4444444441', userId: uCustomer4, type: 'TRANSFER_OUT', amount: 350000, beforeBalance: 770000, afterBalance: 420000, description: 'Bi-Weekly Contractor & Vendor Disbursements', daysAgo: 15 },

    // --- Priya Sharma: Tech Corp Operating Reserve (TX4444444442) -> Final Balance: 950000 ---
    { accountId: acc9Id, accountNumber: 'TX4444444442', userId: uCustomer4, type: 'DEPOSIT', amount: 800000, beforeBalance: 0, afterBalance: 800000, description: 'Corporate Liquid Reserve Capital', daysAgo: 220 },
    { accountId: acc9Id, accountNumber: 'TX4444444442', userId: uCustomer4, type: 'INTEREST_CREDIT', amount: 35000, beforeBalance: 800000, afterBalance: 835000, description: 'Corporate Treasury Sweep Interest', daysAgo: 120 },
    { accountId: acc9Id, accountNumber: 'TX4444444442', userId: uCustomer4, type: 'TRANSFER_IN', amount: 100000, beforeBalance: 835000, afterBalance: 935000, description: 'Surplus Working Capital Sweep', daysAgo: 60 },
    { accountId: acc9Id, accountNumber: 'TX4444444442', userId: uCustomer4, type: 'INTEREST_CREDIT', amount: 15000, beforeBalance: 935000, afterBalance: 950000, description: 'Monthly Money Market Yield', daysAgo: 10 },

    // --- Marcus Vance: Commercial Escrow Account (TX5555555551) -> Final Balance: 215000 ---
    { accountId: acc10Id, accountNumber: 'TX5555555551', userId: uCustomer5, type: 'DEPOSIT', amount: 500000, beforeBalance: 0, afterBalance: 500000, description: 'Commercial Real Estate Acquisition Deposit', daysAgo: 150 },
    { accountId: acc10Id, accountNumber: 'TX5555555551', userId: uCustomer5, type: 'TRANSFER_OUT', amount: 250000, beforeBalance: 500000, afterBalance: 250000, description: 'Title Clearance & Legal Escrow Release', daysAgo: 100 },
    { accountId: acc10Id, accountNumber: 'TX5555555551', userId: uCustomer5, type: 'TRANSFER_OUT', amount: 50000, beforeBalance: 250000, afterBalance: 200000, description: 'Environmental Audit & Survey Inspection Fee', daysAgo: 60 },
    { accountId: acc10Id, accountNumber: 'TX5555555551', userId: uCustomer5, type: 'INTEREST_CREDIT', amount: 15000, beforeBalance: 200000, afterBalance: 215000, description: 'Escrow Trust APY Compounding Credit', daysAgo: 20 },

    // --- TransactX Treasury: Central Core Liquidity Vault (TX9999999991) -> Final Balance: 1500000 ---
    { accountId: acc11Id, accountNumber: 'TX9999999991', userId: uAdmin1, type: 'DEPOSIT', amount: 1000000, beforeBalance: 0, afterBalance: 1000000, description: 'RBI Statutory Reserve Ratio Capital Allocation', daysAgo: 300 },
    { accountId: acc11Id, accountNumber: 'TX9999999991', userId: uAdmin1, type: 'TRANSFER_IN', amount: 500000, beforeBalance: 1000000, afterBalance: 1500000, description: 'Inter-Bank Clearing House Settlement Credit', daysAgo: 180 },

    // --- TransactX Treasury: ATM Terminal Reserve Float (TX9999999992) -> Final Balance: 750000 ---
    { accountId: acc12Id, accountNumber: 'TX9999999992', userId: uAdmin1, type: 'DEPOSIT', amount: 800000, beforeBalance: 0, afterBalance: 800000, description: 'ATM Network Initial Float Allocation', daysAgo: 300 },
    { accountId: acc12Id, accountNumber: 'TX9999999992', userId: uAdmin1, type: 'TRANSFER_OUT', amount: 50000, beforeBalance: 800000, afterBalance: 750000, description: 'Terminal Float Balancing & Cassette Replenishment', daysAgo: 90 },
  ];

  const transactions: TransactionEntity[] = txSpecs.map((s) => {
    const txRef = 'TX-REF-' + crypto.randomUUID().slice(0, 15);
    return {
      id: crypto.randomUUID(),
      transactionRef: txRef,
      accountId: s.accountId,
      accountNumber: s.accountNumber,
      userId: s.userId,
      atmId: s.atmId,
      type: s.type,
      status: 'SUCCESS',
      beforeBalance: s.beforeBalance,
      afterBalance: s.afterBalance,
      amount: s.amount,
      description: s.description,
      createdAt: past(s.daysAgo),
    };
  });

  const ledgers: LedgerEntryEntity[] = transactions.map((t) => {
    const isCredit = ['DEPOSIT', 'TRANSFER_IN', 'SALARY_CREDIT', 'INTEREST_CREDIT'].includes(t.type);
    return {
      id: crypto.randomUUID(),
      transactionRef: t.transactionRef,
      accountId: t.accountId,
      entryType: isCredit ? 'CREDIT' : 'DEBIT',
      amount: t.amount,
      balanceSnapshot: t.afterBalance,
      createdAt: t.createdAt,
    };
  });

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
      createdAt: past(240),
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
      createdAt: past(130),
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
      createdAt: past(50),
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
      createdAt: past(95),
    },
  ];

  return {
    users,
    accounts,
    atms,
    transactions,
    ledgers,
    auditLogs,
    version: 5,
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
        if (parsed && parsed.accounts && parsed.accounts.length >= 12 && parsed.transactions && parsed.transactions.length >= 40) {
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

  // --- Auth operations with Role Selection Support ---
  public findUserByUsername(username: string): UserEntity | undefined {
    return this.db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public findUserById(id: string): UserEntity | undefined {
    return this.db.users.find((u) => u.id === id);
  }

  public createUser(
    username: string,
    email: string,
    fullName: string,
    passwordHash: string,
    roleInput: string | string[] = 'CUSTOMER'
  ): UserEntity {
    // Map selected role accurately
    let roles = ['ROLE_CUSTOMER'];
    const r = Array.isArray(roleInput) ? roleInput[0] : roleInput;
    if (r === 'ADMIN' || r === 'ROLE_ADMIN') {
      roles = ['ROLE_ADMIN', 'ROLE_MANAGER'];
    } else if (r === 'MANAGER' || r === 'ROLE_MANAGER') {
      roles = ['ROLE_MANAGER'];
    }

    const newUser: UserEntity = {
      id: 'u-' + crypto.randomUUID(),
      username,
      email,
      fullName,
      passwordHash,
      roles,
      accountLocked: false,
      failedLoginAttempts: 0,
    };
    this.db.users.push(newUser);

    const accNum = 'TX' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const newAcc: AccountEntity = {
      id: 'acc-' + crypto.randomUUID(),
      userId: newUser.id,
      accountNumber: accNum,
      accountType: roles.includes('ROLE_ADMIN') ? 'Administrative Ledger' : 'Primary Checking',
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
      roles,
    }, txRef);

    this.save();
    return newUser;
  }

  public updateUserProfile(userId: string, fullName: string, email: string): UserEntity {
    const u = this.findUserById(userId);
    if (!u) throw new Error('User not found');
    u.fullName = fullName;
    u.email = email;
    this.db.accounts.forEach((a) => {
      if (a.userId === userId) a.ownerName = fullName;
    });
    this.addAuditLog(userId, u.username, 'PROFILE_UPDATED', '127.0.0.1', 'TransactX Web Client', undefined, { fullName, email });
    this.save();
    return u;
  }

  // --- Accounts operations ---
  public getAllAccounts(): AccountEntity[] {
    return JSON.parse(JSON.stringify(this.db.accounts));
  }

  public getAccountsForUser(userId: string): AccountEntity[] {
    const user = this.findUserById(userId);
    if (user && (user.roles.includes('ROLE_ADMIN') || user.roles.includes('ROLE_MANAGER'))) {
      return JSON.parse(JSON.stringify(this.db.accounts));
    }
    // Strict RBAC: Customers can only access accounts they explicitly own
    const userAccs = this.db.accounts.filter((a) => a.userId === userId);
    return JSON.parse(JSON.stringify(userAccs));
  }

  // Sanitized recipient directory for customer fund transfers: NO balances or private data exposed
  public getTransferRecipients(): { accountNumber: string; ownerName: string; accountType: string }[] {
    return this.db.accounts
      .filter((a) => a.status === 'ACTIVE')
      .map((a) => ({
        accountNumber: a.accountNumber,
        ownerName: a.ownerName,
        accountType: a.accountType,
      }));
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
    return JSON.parse(JSON.stringify(newAcc));
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
    const list = this.db.transactions
      .filter((t) => t.accountNumber === accountNumber)
      .slice(0, 30);
    return JSON.parse(JSON.stringify(list));
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
      .slice(0, 6)
      .map((t) => ({
        transactionRef: t.transactionRef,
        accountNumber: t.accountNumber,
        amount: t.amount,
        type: t.type,
      }));

    return JSON.parse(
      JSON.stringify({
        totalCustomers,
        totalAccounts,
        totalTransactions,
        failedTransactions,
        avgResponseTimeMs: 16,
        cacheStats: {
          Provider: 'Upstash / In-Memory Redis Engine',
          'Active Sessions Cached': 6,
          'OTP TTL Store': 'Active',
        },
        largestTransactions,
        accounts: this.db.accounts,
      })
    );
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

    return JSON.parse(
      JSON.stringify({
        content,
        totalElements,
        totalPages,
        size,
        number: page,
      })
    );
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
