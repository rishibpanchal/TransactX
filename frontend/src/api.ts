import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { simulationDb } from './mockEngine';
import type { UserEntity } from './mockEngine';

// Base URL from environment or local default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Engine mode: 'simulation' (default for presentation & zero setup) or 'backend'
export const getEngineMode = (): 'simulation' | 'backend' => {
  const mode = localStorage.getItem('transactx_engine_mode');
  if (mode === 'backend') return 'backend';
  return 'simulation'; // Default to standalone simulation for permanence and zero setup
};

export const setEngineMode = (mode: 'simulation' | 'backend') => {
  localStorage.setItem('transactx_engine_mode', mode);
};

export const resetSimulationDatabase = () => {
  simulationDb.resetToDefault();
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to extract current user from request Authorization header
function getCurrentUser(config: InternalAxiosRequestConfig | AxiosRequestConfig): UserEntity {
  const authHeader = (config.headers?.Authorization as string) || (api.defaults.headers.common['Authorization'] as string);
  if (authHeader && authHeader.startsWith('Bearer sim-token-')) {
    const userId = authHeader.replace('Bearer sim-token-', '');
    const user = simulationDb.findUserById(userId);
    if (user) return user;
  }
  // Fallback to customer1 Jane Doe
  return simulationDb.findUserByUsername('customer1')!;
}

// Simulated Request Dispatcher
async function handleSimulatedRequest(config: InternalAxiosRequestConfig | AxiosRequestConfig): Promise<AxiosResponse> {
  // Simulate 80ms processing latency
  await new Promise((resolve) => setTimeout(resolve, 80));

  const rawUrl = config.url || '';
  const urlWithoutHost = rawUrl.replace(/https?:\/\/[^/]+/, '');
  const [pathname, queryString] = urlWithoutHost.split('?');
  const method = (config.method || 'get').toLowerCase();

  // Parse body data
  let body: any = {};
  if (config.data) {
    body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
  }

  // Parse query params
  const urlParams = new URLSearchParams(queryString || '');
  const params: Record<string, any> = { ...config.params };
  urlParams.forEach((value, key) => {
    params[key] = value;
  });

  const currentUser = getCurrentUser(config);

  const makeResponse = (data: any, status: number = 200): AxiosResponse => ({
    data: data !== undefined ? (data instanceof Blob ? data : JSON.parse(JSON.stringify(data))) : data,
    status,
    statusText: 'OK',
    headers: {},
    config: config as InternalAxiosRequestConfig,
  });

  const makeError = (message: string, status: number = 400) => {
    const error: any = new Error(message);
    error.response = {
      data: { message, timestamp: new Date().toISOString() },
      status,
      statusText: 'Bad Request',
      headers: {},
      config: config as InternalAxiosRequestConfig,
    };
    return Promise.reject(error);
  };

  // --- Route Handlers ---

  // Auth: Login
  if (pathname === '/api/v1/auth/login' && method === 'post') {
    const { username, password } = body;
    const user = simulationDb.findUserByUsername(username);
    if (!user || (user.passwordHash && user.passwordHash !== password)) {
      return makeError('Invalid username or password', 401);
    }
    return makeResponse({
      accessToken: 'sim-token-' + user.id,
      refreshToken: 'sim-refresh-' + user.id,
      userId: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
    });
  }

  // Auth: Register
  if (pathname === '/api/v1/auth/register' && method === 'post') {
    const { username, email, fullName, password, role, roles } = body;
    if (simulationDb.findUserByUsername(username)) {
      return makeError('Username already taken', 400);
    }
    const chosenRole = role || (roles && roles[0]) || 'CUSTOMER';
    const newUser = simulationDb.createUser(username, email, fullName, password, chosenRole);
    return makeResponse({
      accessToken: 'sim-token-' + newUser.id,
      refreshToken: 'sim-refresh-' + newUser.id,
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      roles: newUser.roles,
    });
  }

  // Auth: Refresh Token
  if (pathname === '/api/v1/auth/refresh' && method === 'post') {
    return makeResponse({
      accessToken: 'sim-token-' + currentUser.id,
      refreshToken: 'sim-refresh-' + currentUser.id,
    });
  }

  // Auth: Get Current Profile
  if (pathname === '/api/v1/auth/me' && method === 'get') {
    return makeResponse({
      userId: currentUser.id,
      username: currentUser.username,
      email: currentUser.email,
      fullName: currentUser.fullName,
      roles: currentUser.roles,
    });
  }

  // Auth: Update Profile
  if (pathname === '/api/v1/auth/profile' && method === 'put') {
    const { fullName, email } = body;
    const updated = simulationDb.updateUserProfile(currentUser.id, fullName, email);
    return makeResponse({
      userId: updated.id,
      username: updated.username,
      email: updated.email,
      fullName: updated.fullName,
      roles: updated.roles,
    });
  }

  // Auth: Logout
  if (pathname === '/api/v1/auth/logout' && method === 'post') {
    return makeResponse({ message: 'Logged out successfully' });
  }

  // Accounts: Get My Accounts (Returns all bank accounts with owner & classification)
  if (pathname === '/api/v1/accounts/my' && method === 'get') {
    const accounts = simulationDb.getAllAccounts();
    return makeResponse(accounts);
  }

  // Accounts: Create Account
  if (pathname === '/api/v1/accounts' && method === 'post') {
    const initialBalance = parseFloat(body.initialBalance) || 0;
    const acc = simulationDb.createAccount(currentUser.id, initialBalance);
    return makeResponse(acc, 201);
  }

  // ATM: Machines
  if (pathname === '/api/v1/atm/machines' && method === 'get') {
    return makeResponse(simulationDb.getAtms());
  }

  // ATM: Mini Statement
  if (pathname === '/api/v1/atm/statement' && method === 'get') {
    const accNum = params.accountNumber || '';
    return makeResponse(simulationDb.getMiniStatement(accNum));
  }

  // ATM: Cash Withdrawal
  if (pathname === '/api/v1/atm/withdraw' && method === 'post') {
    try {
      const { accountNumber, amount, atmId } = body;
      const res = simulationDb.withdrawCash(accountNumber, parseFloat(amount), atmId, currentUser);
      return makeResponse(res);
    } catch (e: any) {
      return makeError(e.message || 'Withdrawal failed');
    }
  }

  // ATM: Cash Deposit
  if (pathname === '/api/v1/atm/deposit' && method === 'post') {
    try {
      const { accountNumber, amount, atmId, denominations } = body;
      const res = simulationDb.depositCash(accountNumber, parseFloat(amount), atmId, denominations, currentUser);
      return makeResponse(res);
    } catch (e: any) {
      return makeError(e.message || 'Deposit failed');
    }
  }

  // ATM: Fund Transfer
  if (pathname === '/api/v1/atm/transfer' && method === 'post') {
    try {
      const { sourceAccountNumber, destinationAccountNumber, amount } = body;
      const res = simulationDb.transferFunds(sourceAccountNumber, destinationAccountNumber, parseFloat(amount), currentUser);
      return makeResponse(res);
    } catch (e: any) {
      return makeError(e.message || 'Transfer failed');
    }
  }

  // Admin: Stats
  if (pathname === '/api/v1/admin/stats' && method === 'get') {
    return makeResponse(simulationDb.getAdminStats());
  }

  // Admin: Concurrency Test
  if (pathname === '/api/v1/admin/concurrency-test' && method === 'post') {
    const src = params.sourceAccountNumber || body.sourceAccountNumber;
    const dest = params.destinationAccountNumber || body.destinationAccountNumber;
    const amount = parseFloat(params.amount || body.amount || '1');
    const totalRequests = parseInt(params.totalRequests || body.totalRequests || '50');
    const lockingType = (params.lockingType || body.lockingType || 'OPTIMISTIC') as 'OPTIMISTIC' | 'PESSIMISTIC';

    const res = simulationDb.runConcurrencyTest(src, dest, amount, totalRequests, lockingType);
    return makeResponse(res);
  }

  // Admin: Audit Logs
  if (pathname === '/api/v1/admin/audit' && method === 'get') {
    const page = parseInt(params.page || '0');
    const size = parseInt(params.size || '15');
    const action = params.action;
    const username = params.username;
    const search = params.search;

    const res = simulationDb.getAuditLogs(page, size, action, username, search);
    return makeResponse(res);
  }

  // Admin: Audit Logs Export
  if (pathname.startsWith('/api/v1/admin/audit/export/') && method === 'get') {
    const format = pathname.split('/').pop() || 'csv';
    const blob = simulationDb.exportAuditLogs(format);
    return makeResponse(blob);
  }

  return makeError(`Simulated endpoint not found: ${method.toUpperCase()} ${pathname}`, 404);
}

// Request Interceptor: Route to simulation or attach JWT & Correlation IDs
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const mode = getEngineMode();

    if (mode === 'simulation') {
      // Use simulation adapter directly
      config.adapter = handleSimulatedRequest as any;
      return config;
    }

    // Backend mode: Attach standard headers
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['X-Request-Id'] = crypto.randomUUID();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Fallback to simulation if backend is unreachable
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If backend connection refused or offline, seamlessly fallback to simulation engine
    if (
      !originalRequest?._retryInSimulation &&
      (error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.response?.status === 502 ||
        error.response?.status === 503 ||
        error.code === 'ECONNABORTED')
    ) {
      console.warn('Live backend unreachable. Seamlessly activating TransactX persistent simulation engine.');
      setEngineMode('simulation');
      originalRequest._retryInSimulation = true;
      return handleSimulatedRequest(originalRequest);
    }

    return Promise.reject(error);
  }
);
