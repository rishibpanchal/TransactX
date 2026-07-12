import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  CreditCard, 
  Activity, 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet, 
  ShieldAlert, 
  Flame,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Concurrency Sandbox Form States
  const [sourceAcc, setSourceAcc] = useState('');
  const [destAcc, setDestAcc] = useState('');
  const [testAmount, setTestAmount] = useState('1.00');
  const [requestsCount, setRequestsCount] = useState('50');
  const [simResults, setSimResults] = useState<any[]>([]);

  // Query: Get high-level system metrics
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/stats');
      return res.data;
    },
    refetchInterval: 10000, // Poll statistics every 10 seconds
  });

  // Mutation: Trigger locking simulation
  const concurrencyMutation = useMutation({
    mutationFn: async (lockingType: 'OPTIMISTIC' | 'PESSIMISTIC') => {
      const res = await api.post(
        `/api/v1/admin/concurrency-test?sourceAccountNumber=${sourceAcc}&destinationAccountNumber=${destAcc}&amount=${parseFloat(testAmount)}&totalRequests=${parseInt(requestsCount)}&lockingType=${lockingType}`
      );
      return res.data;
    },
    onSuccess: (data) => {
      showToast(`Concurrency test for ${data.lockingType} completed!`, 'success');
      setSimResults((prev) => [data, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Concurrency test execution failed';
      showToast(msg, 'error');
    }
  });

  const runTest = (type: 'OPTIMISTIC' | 'PESSIMISTIC') => {
    if (!sourceAcc || !destAcc || !testAmount || !requestsCount) {
      showToast('Please specify all source, destination, amount, and request parameters', 'error');
      return;
    }
    concurrencyMutation.mutate(type);
  };

  const handleAutofillAccounts = () => {
    // Look up two customer accounts from the dashboard stats if available, or fill standard placeholders
    if (stats?.largestTransactions?.length > 0) {
      // Find distinct accounts to transfer between
      const distinct = Array.from(new Set(stats.largestTransactions.map((tx: any) => tx.accountNumber)));
      if (distinct.length >= 2) {
        setSourceAcc(distinct[0] as string);
        setDestAcc(distinct[1] as string);
        return;
      }
    }
    // Fallbacks
    setSourceAcc('TX1111111111');
    setDestAcc('TX2222222222');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Metrics Row */}
      {loadingStats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="glass-panel p-5 flex flex-col justify-between border-t-2 border-primary relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Customers</span>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-white mt-2">{stats.totalCustomers}</h3>
            <span className="text-[10px] text-muted font-medium mt-1">Customers provisioned in DB</span>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-5 flex flex-col justify-between border-t-2 border-accent relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Transactions</span>
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-white mt-2">{stats.totalTransactions}</h3>
            <span className="text-[10px] text-muted font-medium mt-1">Deposit/withdraw/transfer logs</span>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-5 flex flex-col justify-between border-t-2 border-danger relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Failed Operations</span>
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-white mt-2">{stats.failedTransactions}</h3>
            <span className="text-[10px] text-muted font-medium mt-1">Rollbacks or locking failures</span>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-5 flex flex-col justify-between border-t-2 border-purple-500 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average API Latency</span>
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-white mt-2">{stats.avgResponseTimeMs} ms</h3>
            <span className="text-[10px] text-muted font-medium mt-1">Core engine execution SLA</span>
          </div>
        </div>
      ) : null}

      {/* Concurrency Locking Simulator Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Simulator controls (1 col) */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
              <h4 className="font-bold">Concurrency Locking Sandbox</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Simulate high write contention by executing hundreds of simultaneous money transfers from a source account using Java 25 Virtual Threads. Select a lock type to observe results.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">Test Accounts</label>
                <button
                  type="button"
                  onClick={handleAutofillAccounts}
                  className="text-primary hover:underline text-[10px] font-bold"
                >
                  Auto-fill values
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={sourceAcc}
                  onChange={(e) => setSourceAcc(e.target.value)}
                  placeholder="Source Account Number"
                  className="w-full p-2.5 glass-input text-xs"
                />
                <input
                  type="text"
                  value={destAcc}
                  onChange={(e) => setDestAcc(e.target.value)}
                  placeholder="Destination Account Number"
                  className="w-full p-2.5 glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Transfer Amount (₹)</label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(e.target.value)}
                    className="w-full p-2.5 glass-input text-xs text-center"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 font-semibold mb-1">Parallel Threads</label>
                  <input
                    type="number"
                    value={requestsCount}
                    onChange={(e) => setRequestsCount(e.target.value)}
                    className="w-full p-2.5 glass-input text-xs text-center"
                    min="1"
                    max="500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5 mt-6">
            <button
              onClick={() => runTest('OPTIMISTIC')}
              disabled={concurrencyMutation.isPending}
              className="p-3 bg-indigo-900/60 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-900 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              Test Optimistic
            </button>
            <button
              onClick={() => runTest('PESSIMISTIC')}
              disabled={concurrencyMutation.isPending}
              className="p-3 bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-900 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            >
              Test Pessimistic
            </button>
          </div>
        </div>

        {/* Simulator lock results compared (2 cols) */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col justify-between min-h-[450px]">
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm">Locking Performance Matrix</h4>
            </div>
            
            {simResults.length > 0 ? (
              <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2">
                {simResults.map((res: any, idx: number) => {
                  const isOptimistic = res.lockingType === 'OPTIMISTIC';
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 border rounded-xl relative overflow-hidden animate-slide-in ${
                        isOptimistic 
                          ? 'bg-indigo-950/20 border-indigo-500/20' 
                          : 'bg-emerald-950/20 border-emerald-500/20'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 border rounded-full ${
                          isOptimistic 
                            ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-300' 
                            : 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        }`}>
                          {res.lockingType} LOCKING
                        </span>
                        <span className="text-[10px] text-muted font-bold font-mono">Elapsed: {res.durationMs}ms</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center my-3 text-xs">
                        <div className="bg-white/5 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Total Load</span>
                          <b className="text-white font-mono">{res.totalRequests}</b>
                        </div>
                        <div className="bg-emerald-950/20 border border-emerald-500/10 p-2 rounded-lg text-emerald-300">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Successes</span>
                          <b className="font-mono">{res.successfulRequests}</b>
                        </div>
                        <div className="bg-rose-950/20 border border-rose-500/10 p-2 rounded-lg text-rose-300">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Failures</span>
                          <b className="font-mono">{res.failedRequests}</b>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Final Bal</span>
                          <b className="text-white font-mono">₹{res.finalBalance.toFixed(2)}</b>
                        </div>
                      </div>

                      <p className="text-[10px] leading-relaxed text-slate-400 border-t border-white/5 pt-2">
                        {res.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/5 rounded-xl">
                <HelpCircle className="w-10 h-10 text-slate-500 mb-2" />
                <span className="text-sm font-semibold text-slate-400">Sandbox is idle</span>
                <span className="text-xs text-muted mt-1">Specify parameters on the left and trigger a test to start.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Statistics */}
      {stats && (
        <div className="glass-panel p-6">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" /> System Cache & Database Statistics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
              <span className="font-bold text-slate-200 block mb-1">Upstash Cache Status</span>
              <div className="flex justify-between"><span>Provider:</span><b>{stats.cacheStats.Provider}</b></div>
              <div className="flex justify-between"><span>Session Store:</span><b>{stats.cacheStats["Active Sessions Cached"]}</b></div>
              <div className="flex justify-between"><span>OTP TTL Store:</span><b>Active</b></div>
            </div>
            
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
              <span className="font-bold text-slate-200 block mb-1">Postgres Engine Status</span>
              <div className="flex justify-between"><span>Connection Pooling:</span><b>Enabled (Hikari)</b></div>
              <div className="flex justify-between"><span>Uptime status:</span><b>ONLINE (Neon Server)</b></div>
              <div className="flex justify-between"><span>Isolation Level:</span><b>READ_COMMITTED (Configurable)</b></div>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
              <span className="font-bold text-slate-200 block mb-1">Virtual Threads Pool</span>
              <div className="flex justify-between"><span>Execution Pool:</span><b>Platform/Virtual Threads</b></div>
              <div className="flex justify-between"><span>Thread Model:</span><b>Java 25 (Loom Virtual Threads)</b></div>
              <div className="flex justify-between"><span>Maximum pool size:</span><b>Unbounded</b></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
