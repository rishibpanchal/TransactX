import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { 
  Cpu, 
  ArrowRightLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CheckCircle2, 
  Layers, 
  Key, 
  RefreshCw 
} from 'lucide-react';

export const AtmSimulator: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdraw' | 'deposit' | 'transfer'>('withdraw');
  const [selectedAtmId, setSelectedAtmId] = useState<string>('');
  const [selectedAccountNum, setSelectedAccountNum] = useState<string>('');
  
  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [dispenseReceipt, setDispenseReceipt] = useState<any>(null);

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('');
  const [dep100, setDep100] = useState('0');
  const [dep50, setDep50] = useState('0');
  const [dep20, setDep20] = useState('0');
  const [dep10, setDep10] = useState('0');

  // Automatic Denomination Rebalancing Logic
  const handleTotalDepositChange = (val: string) => {
    setDepositAmount(val);
    const amount = parseInt(val) || 0;
    if (amount <= 0) {
      setDep100('0');
      setDep50('0');
      setDep20('0');
      setDep10('0');
      return;
    }
    let rem = amount;
    const n100 = Math.floor(rem / 100);
    rem %= 100;
    const n50 = Math.floor(rem / 50);
    rem %= 50;
    const n20 = Math.floor(rem / 20);
    rem %= 20;
    const n10 = Math.floor(rem / 10);
    
    setDep100(n100.toString());
    setDep50(n50.toString());
    setDep20(n20.toString());
    setDep10(n10.toString());
  };

  const handleDenominationChange = (changedDenom: number, countStr: string) => {
    const newCount = Math.max(0, parseInt(countStr) || 0);
    
    if (changedDenom === 100) setDep100(newCount.toString());
    if (changedDenom === 50) setDep50(newCount.toString());
    if (changedDenom === 20) setDep20(newCount.toString());
    if (changedDenom === 10) setDep10(newCount.toString());

    let total = parseInt(depositAmount) || 0;
    const contrib = changedDenom * newCount;

    if (contrib > total) {
      total = contrib;
      setDepositAmount(total.toString());
      if (changedDenom !== 100) setDep100('0');
      if (changedDenom !== 50) setDep50('0');
      if (changedDenom !== 20) setDep20('0');
      if (changedDenom !== 10) setDep10('0');
      return;
    }

    let remaining = total - contrib;
    const otherDenoms = [100, 50, 20, 10].filter(d => d !== changedDenom);
    const newCounts: Record<number, number> = {};
    for (const d of otherDenoms) {
      newCounts[d] = Math.floor(remaining / d);
      remaining %= d;
    }

    if (changedDenom !== 100) setDep100(newCounts[100].toString());
    if (changedDenom !== 50) setDep50(newCounts[50].toString());
    if (changedDenom !== 20) setDep20(newCounts[20].toString());
    if (changedDenom !== 10) setDep10(newCounts[10].toString());
  };

  // Transfer Form State
  const [destAccountNum, setDestAccountNum] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [lockingType, setLockingType] = useState('PESSIMISTIC');
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  // Query: Get all ATMs
  const { data: atms = [], isLoading: loadingAtms } = useQuery({
    queryKey: ['atms'],
    queryFn: async () => {
      const res = await api.get('/api/v1/atm/machines');
      const data = res.data;
      if (data.length > 0 && !selectedAtmId) {
        setSelectedAtmId(data[0].id);
      }
      return data;
    },
  });

  // Query: Get my accounts
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

  const activeAtm = atms.find((a: any) => a.id === selectedAtmId);

  // Mutation: Withdrawal
  const withdrawMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/api/v1/atm/withdraw', payload);
      return res.data;
    },
    onSuccess: (data) => {
      showToast(`Dispensed ₹${data.amount} successfully!`, 'success');
      setDispenseReceipt(data);
      queryClient.invalidateQueries({ queryKey: ['myAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['atms'] });
      setWithdrawAmount('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Withdrawal failed';
      showToast(msg, 'error');
      setDispenseReceipt(null);
    }
  });

  // Mutation: Deposit
  const depositMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/api/v1/atm/deposit', payload);
      return res.data;
    },
    onSuccess: (data) => {
      showToast(`Deposited ₹${data.amount} successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['myAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['atms'] });
      // Reset form
      setDepositAmount('');
      setDep100('0');
      setDep50('0');
      setDep20('0');
      setDep10('0');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Deposit failed';
      showToast(msg, 'error');
    }
  });

  // Mutation: Transfer
  const transferMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post(`/api/v1/atm/transfer?lockingType=${lockingType}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      showToast(`Transferred ₹${data.amount} to ${destAccountNum} successfully!`, 'success');
      queryClient.invalidateQueries({ queryKey: ['myAccounts'] });
      // Reset form
      setDestAccountNum('');
      setTransferAmount('');
      setIdempotencyKey(crypto.randomUUID());
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Transfer rolled back';
      showToast(msg, 'error');
    }
  });

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountNum || !selectedAtmId || !withdrawAmount) return;
    withdrawMutation.mutate({
      accountNumber: selectedAccountNum,
      amount: parseFloat(withdrawAmount),
      atmId: selectedAtmId
    });
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountNum || !depositAmount) return;

    const n100 = parseInt(dep100) || 0;
    const n50 = parseInt(dep50) || 0;
    const n20 = parseInt(dep20) || 0;
    const n10 = parseInt(dep10) || 0;
    const computedTotal = (n100 * 100) + (n50 * 50) + (n20 * 20) + (n10 * 10);
    const enteredAmt = parseFloat(depositAmount);

    if (computedTotal !== enteredAmt) {
      showToast(`Denomination total (₹${computedTotal}) must match deposit total (₹${enteredAmt})`, 'error');
      return;
    }

    depositMutation.mutate({
      accountNumber: selectedAccountNum,
      amount: enteredAmt,
      atmId: selectedAtmId || null,
      denominations: {
        "100": n100,
        "50": n50,
        "20": n20,
        "10": n10
      }
    });
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountNum || !destAccountNum || !transferAmount) return;

    transferMutation.mutate({
      sourceAccountNumber: selectedAccountNum,
      destinationAccountNumber: destAccountNum,
      amount: parseFloat(transferAmount),
      idempotencyKey
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* ATM Machine Info & Denomination Display (Left Col) */}
      <div className="space-y-6">
        <div className="glass-panel p-6 border-t-4 border-t-primary">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-primary" />
            <h4 className="font-bold">Select Physical ATM Terminal</h4>
          </div>

          {loadingAtms ? (
            <div className="h-10 bg-white/5 animate-pulse rounded-lg" />
          ) : (
            <select
              value={selectedAtmId}
              onChange={(e) => setSelectedAtmId(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary mb-4"
            >
              {atms.map((atm: any) => (
                <option key={atm.id} value={atm.id}>
                  {atm.name} ({atm.location})
                </option>
              ))}
            </select>
          )}

          {activeAtm && (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                <span className="text-slate-400">Terminal Cash Reserve:</span>
                <span className="font-bold text-white">₹{activeAtm.cashBalance.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">Available Bill Cassettes</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(activeAtm.denominations).map(([note, count]: [string, any]) => (
                    <div key={note} className="bg-white/5 border border-white/5 p-2 rounded-lg flex justify-between items-center">
                      <span className="font-bold text-slate-300">₹{note} bills</span>
                      <span className="bg-primary/20 text-primary font-bold px-2 py-0.5 rounded">{count} left</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic withdrawal receipt display */}
        {dispenseReceipt && (
          <div className="glass-panel p-6 border border-emerald-500/20 bg-emerald-950/20 rounded-xl relative overflow-hidden animate-slide-in">
            <div className="absolute right-3 top-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="font-bold text-emerald-300 text-sm uppercase tracking-wider mb-2">ATM Dispense Receipt</h4>
            <div className="text-xs space-y-2 text-slate-300">
              <div>Ref: <b className="font-mono text-[10px] text-white">{dispenseReceipt.transactionRef}</b></div>
              <div>Type: <b className="text-white">{dispenseReceipt.type}</b></div>
              <div>Status: <b className="text-emerald-400">{dispenseReceipt.status}</b></div>
              <div className="border-t border-white/5 pt-2 flex justify-between text-white font-bold text-sm">
                <span>Dispensed Amount:</span>
                <span>₹{dispenseReceipt.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Forms Panel (Right / 2 cols) */}
      <div className="lg:col-span-2 glass-panel p-6">
        {/* Account Selector inside transactions */}
        <div className="mb-6 p-4 border border-white/5 bg-white/[0.01] rounded-xl flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-300">My Source Account:</span>
          <select
            value={selectedAccountNum}
            onChange={(e) => setSelectedAccountNum(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-primary max-w-md"
          >
            {accounts.map((a: any) => (
              <option key={a.id} value={a.accountNumber}>
                {a.accountNumber} • {a.ownerName ? `${a.ownerName} - ` : ''}{a.accountType || 'Account'} (₹{Number(a.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })})
              </option>
            ))}
          </select>
        </div>

        {/* Action Tabs */}
        <div className="flex border-b border-white/5 mb-6">
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'withdraw' ? 'border-b-primary text-white bg-primary/5' : 'border-b-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            ATM Cash Withdrawal
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'deposit' ? 'border-b-primary text-white bg-primary/5' : 'border-b-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            ATM Cash Deposit
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
              activeTab === 'transfer' ? 'border-b-primary text-white bg-primary/5' : 'border-b-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            Fund Transfer System
          </button>
        </div>

        {/* Tab 1: Withdrawal Form */}
        {activeTab === 'withdraw' && (
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Withdrawal Amount (₹)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Must be a multiple of ₹10"
                className="w-full p-3 glass-input text-sm"
                required
              />
              <span className="text-[10px] text-muted block mt-1.5">
                Note: A minimum balance of ₹10.00 must remain in the account. Daily limit: ₹1000.
              </span>
            </div>

            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="w-full p-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm transition-all hover-glow disabled:opacity-50"
            >
              {withdrawMutation.isPending ? 'Dispensing Cash...' : 'Simulate Withdrawal'}
            </button>
          </form>
        )}

        {/* Tab 2: Deposit Form */}
        {activeTab === 'deposit' && (
          <form onSubmit={handleDeposit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Total Deposit Amount (₹)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => handleTotalDepositChange(e.target.value)}
                placeholder="Total sum of bill counts"
                className="w-full p-3 glass-input text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Load Bill Denominations</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div>
                  <span className="text-xs text-muted block mb-1">₹100 bills</span>
                  <input
                    type="number"
                    value={dep100}
                    onChange={(e) => handleDenominationChange(100, e.target.value)}
                    className="w-full p-2 glass-input text-center text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted block mb-1">₹50 bills</span>
                  <input
                    type="number"
                    value={dep50}
                    onChange={(e) => handleDenominationChange(50, e.target.value)}
                    className="w-full p-2 glass-input text-center text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted block mb-1">₹20 bills</span>
                  <input
                    type="number"
                    value={dep20}
                    onChange={(e) => handleDenominationChange(20, e.target.value)}
                    className="w-full p-2 glass-input text-center text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <span className="text-xs text-muted block mb-1">₹10 bills</span>
                  <input
                    type="number"
                    value={dep10}
                    onChange={(e) => handleDenominationChange(10, e.target.value)}
                    className="w-full p-2 glass-input text-center text-sm"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={depositMutation.isPending}
              className="w-full p-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm transition-all hover-glow disabled:opacity-50"
            >
              {depositMutation.isPending ? 'Verifying Bills...' : 'Simulate Deposit'}
            </button>
          </form>
        )}

        {/* Tab 3: Transfer Form */}
        {activeTab === 'transfer' && (
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Destination Account Number</label>
                <input
                  type="text"
                  value={destAccountNum}
                  onChange={(e) => setDestAccountNum(e.target.value)}
                  placeholder="e.g. TX2222222222"
                  className="w-full p-2.5 glass-input text-sm font-mono"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-500 self-center">Quick pick:</span>
                  {[
                    { label: 'John Smith (Everyday)', num: 'TX2222222222' },
                    { label: 'Priya Sharma (Corporate)', num: 'TX4444444441' },
                    { label: 'Marcus Vance (Escrow)', num: 'TX5555555551' },
                    { label: 'Alex Rivera (Traveler)', num: 'TX3333333331' },
                  ].map((p) => (
                    <button
                      key={p.num}
                      type="button"
                      onClick={() => setDestAccountNum(p.num)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                        destAccountNum === p.num
                          ? 'bg-primary/20 border-primary text-primary-light font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Transfer Amount (₹)</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full p-2.5 glass-input text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">DB Locking Engine</label>
                <select
                  value={lockingType}
                  onChange={(e) => setLockingType(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                >
                  <option value="PESSIMISTIC">Pessimistic Lock (SELECT FOR UPDATE)</option>
                  <option value="OPTIMISTIC">Optimistic Lock (Version Column check)</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Idempotency Key</label>
                  <button
                    type="button"
                    onClick={() => setIdempotencyKey(crypto.randomUUID())}
                    className="text-primary hover:text-primary-hover flex items-center gap-1 text-[10px] font-bold"
                  >
                    <RefreshCw className="w-3 h-3" /> Regen
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-muted bg-slate-900 border border-white/10 rounded-lg p-2.5">
                  <Key className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{idempotencyKey}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={transferMutation.isPending}
              className="w-full p-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold text-sm transition-all hover-glow disabled:opacity-50"
            >
              {transferMutation.isPending ? 'Executing Core Transaction...' : 'Simulate Fund Transfer'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
