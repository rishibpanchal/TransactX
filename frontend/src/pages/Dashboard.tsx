import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { 
  Plus, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  CheckCircle,
  FileMinus,
  AlertCircle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [selectedAccountNum, setSelectedAccountNum] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [initialBalance, setInitialBalance] = useState('500');

  // Query: Get all user accounts
  const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ['myAccounts'],
    queryFn: async () => {
      const res = await api.get('/api/v1/accounts/my');
      const data = res.data;
      if (data.length > 0 && !selectedAccountNum) {
        setSelectedAccountNum(data[0].accountNumber);
      }
      return data;
    },
  });

  // Query: Get mini-statement for selected account
  const { data: statement = [], isLoading: loadingStatement } = useQuery({
    queryKey: ['statement', selectedAccountNum],
    queryFn: async () => {
      if (!selectedAccountNum) return [];
      const res = await api.get(`/api/v1/atm/statement?accountNumber=${selectedAccountNum}`);
      return res.data;
    },
    enabled: !!selectedAccountNum,
  });

  // Mutation: Create a new account
  const createAccountMutation = useMutation({
    mutationFn: async (initialBalance: number) => {
      return await api.post('/api/v1/accounts', { initialBalance });
    },
    onSuccess: (res) => {
      showToast(`Account ${res.data.accountNumber} created successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['myAccounts'] });
      setSelectedAccountNum(res.data.accountNumber);
      setShowCreateModal(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create account';
      showToast(msg, 'error');
    }
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const balance = parseFloat(initialBalance);
    if (isNaN(balance) || balance < 0) {
      showToast('Initial balance must be positive', 'error');
      return;
    }
    createAccountMutation.mutate(balance);
  };

  const activeAccount = accounts.find((a: any) => a.accountNumber === selectedAccountNum);

  // Compute charts statistics
  const getChartData = () => {
    let depositSum = 0;
    let withdrawSum = 0;
    let transferSum = 0;

    statement.forEach((tx: any) => {
      const amt = Math.abs(tx.amount);
      if (tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN') {
        depositSum += amt;
      } else if (tx.type === 'WITHDRAWAL') {
        withdrawSum += amt;
      } else if (tx.type === 'TRANSFER_OUT') {
        transferSum += amt;
      }
    });

    return [
      { name: 'Credits (Deposits/Inflows)', value: depositSum, color: '#10b981' },
      { name: 'Withdrawals (Atm Out)', value: withdrawSum, color: '#f43f5e' },
      { name: 'Transfers (Outflows)', value: transferSum, color: '#6366f1' },
    ].filter(item => item.value > 0);
  };

  const getMonthlyBarData = () => {
    // Generate simple breakdown mock analytics for visual completeness
    return [
      { month: 'Jan', Inflow: 1200, Outflow: 800 },
      { month: 'Feb', Inflow: 2300, Outflow: 1500 },
      { month: 'Mar', Inflow: 1800, Outflow: 1900 },
      { month: 'Apr', Inflow: 3100, Outflow: 2200 },
      { month: 'May', Inflow: 2500, Outflow: 1700 },
      { month: 'Jun', Inflow: (activeAccount?.balance || 500) + 300, Outflow: (activeAccount?.balance || 500) / 2 },
    ];
  };

  const pieData = getChartData();

  return (
    <div className="space-y-6">
      {/* Account Selector & New Account button */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-400 font-semibold uppercase tracking-wider">Active Account:</label>
          {loadingAccounts ? (
            <div className="h-9 w-48 bg-white/5 animate-pulse rounded-lg" />
          ) : accounts.length > 0 ? (
            <select
              value={selectedAccountNum}
              onChange={(e) => setSelectedAccountNum(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-primary"
            >
              {accounts.map((a: any) => (
                <option key={a.id} value={a.accountNumber} className="bg-slate-900 text-slate-100">
                  {a.accountNumber} • {a.ownerName ? `${a.ownerName} - ` : ''}{a.accountType || 'Standard'} (₹{Number(a.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-danger font-semibold">No accounts found. Create one.</span>
          )}
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all hover-glow"
        >
          <Plus className="w-4 h-4" />
          Open Account
        </button>
      </div>

      {loadingAccounts ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-white/5 animate-pulse rounded-2xl" />
          <div className="h-32 bg-white/5 animate-pulse rounded-2xl" />
          <div className="h-32 bg-white/5 animate-pulse rounded-2xl" />
        </div>
      ) : activeAccount ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Balance Card */}
          <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-primary relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Balance</span>
                  {activeAccount.accountType && (
                    <span className="block text-xs font-medium text-primary-light mt-0.5">
                      {activeAccount.ownerName ? `${activeAccount.ownerName} • ` : ''}{activeAccount.accountType}
                    </span>
                  )}
                </div>
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-3xl font-bold tracking-tight mt-2 text-white">
                ₹{activeAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs text-muted">
              <span>Account Num: <b className="text-slate-200">{activeAccount.accountNumber}</b></span>
              <span className={`px-2 py-0.5 border rounded-full font-bold text-[10px] ${
                activeAccount.status === 'ACTIVE' 
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' 
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
              }`}>
                {activeAccount.status}
              </span>
            </div>
          </div>

          {/* Simple Statistics cards */}
          <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-accent relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-accent/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Inflow</span>
              <h3 className="text-3xl font-bold tracking-tight mt-2 text-white">
                ₹{statement
                  .filter((tx: any) => tx.status === 'SUCCESS' && (tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN' || tx.type === 'INTEREST_CREDIT'))
                  .reduce((sum: number, tx: any) => sum + tx.amount, 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-accent">
              <ArrowUpRight className="w-4 h-4" />
              <span>Deposits & inward transfers</span>
            </div>
          </div>

          <div className="glass-panel p-6 flex flex-col justify-between border-l-4 border-l-danger relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-danger/10 rounded-full blur-xl pointer-events-none" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Outflow</span>
              <h3 className="text-3xl font-bold tracking-tight mt-2 text-white">
                ₹{statement
                  .filter((tx: any) => tx.status === 'SUCCESS' && (tx.type === 'WITHDRAWAL' || tx.type === 'TRANSFER_OUT' || tx.type === 'FEE'))
                  .reduce((sum: number, tx: any) => sum + tx.amount, 0)
                  .toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs text-danger">
              <ArrowDownLeft className="w-4 h-4" />
              <span>Withdrawals & outward transfers</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted mx-auto mb-3" />
          <h3 className="text-lg font-bold">No bank accounts active</h3>
          <p className="text-sm text-muted mt-1">Open your first bank account to begin simulating ledger transactions.</p>
        </div>
      )}

      {/* Main Charts & Mini Statement Panel */}
      {activeAccount && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mini statement (Left / 2 cols) */}
          <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-primary" />
              <h4 className="font-bold">Recent Ledger Statement</h4>
            </div>

            {loadingStatement ? (
              <div className="space-y-3 flex-1 justify-center py-8">
                <div className="h-10 bg-white/5 animate-pulse rounded-lg" />
                <div className="h-10 bg-white/5 animate-pulse rounded-lg" />
                <div className="h-10 bg-white/5 animate-pulse rounded-lg" />
              </div>
            ) : statement.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-400 font-semibold text-xs uppercase">
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.map((tx: any) => {
                      const isCredit = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_IN' || tx.type === 'INTEREST_CREDIT';
                      return (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                          <td className="py-3 px-4 font-mono text-xs">{tx.transactionRef.substring(0, 15)}...</td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-semibold">{tx.type}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                              tx.status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`} />
                            <span className="text-xs font-medium text-slate-300">{tx.status}</span>
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${
                            isCredit ? 'text-accent' : 'text-danger'
                          }`}>
                            {isCredit ? '+' : '-'}₹{tx.amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-300">
                            ₹{tx.afterBalance.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 border border-dashed border-white/5 rounded-xl">
                <FileMinus className="w-8 h-8 text-muted mb-2" />
                <span className="text-sm text-slate-400">No transactions recorded on this account yet.</span>
                <span className="text-xs text-muted mt-1">Simulate a withdrawal, transfer, or deposit in the ATM tab.</span>
              </div>
            )}
          </div>

          {/* Recharts Pie Chart Breakdowns (Right / 1 col) */}
          <div className="glass-panel p-6 flex flex-col justify-between">
            <h4 className="font-bold mb-4">Transaction Analytics</h4>
            {pieData.length > 0 ? (
              <div className="flex-1 flex flex-col justify-center">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `₹${value}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4 text-xs font-medium text-slate-300">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-bold">₹{item.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-8 h-8 text-muted mb-2" />
                <span className="text-sm text-slate-400">Analytical data unavailable</span>
                <span className="text-xs text-muted mt-1">Requires successful deposit or withdrawal records.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Provisioning Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm glass-panel p-6 animate-slide-in">
            <h3 className="text-lg font-bold mb-4">Open New Bank Account</h3>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Initial Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full p-2.5 glass-input text-sm"
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-[10px] text-muted mt-1.5">
                  The initial credit will be automatically provisioned in the core ledger.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createAccountMutation.isPending}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all hover-glow"
                >
                  {createAccountMutation.isPending ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
