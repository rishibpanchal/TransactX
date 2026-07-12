import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import { 
  FileText, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Database,
  Calendar
} from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [username, setUsername] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(15);

  // Query: Get paginated audit logs
  const { data, isLoading } = useQuery({
    queryKey: ['auditLogs', search, action, username, page],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/audit', {
        params: {
          search,
          action,
          username,
          page,
          size,
          sortBy: 'createdAt',
          sortDir: 'desc',
        },
      });
      return res.data;
    },
  });

  const handleExport = async (format: string) => {
    try {
      toast.showToast(`Generating ${format.toUpperCase()} export...`, 'info');
      const res = await api.get(`/api/v1/admin/audit/export/${format}`, {
        params: { search, action, username },
        responseType: 'blob', // Handle binary stream
      });

      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit_logs_${Date.now()}.${format === 'xls' ? 'xlsx' : format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.showToast(`Logs exported as ${format.toUpperCase()} successfully`, 'success');
    } catch (err) {
      toast.showToast('Failed to export audit report', 'error');
    }
  };

  const logs = data?.content || [];
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-6">
      {/* Filtering Search Bar */}
      <div className="glass-panel p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search actions, IP or device..."
              className="w-full pl-9 pr-4 py-2 glass-input text-xs"
            />
          </div>
          <input
            type="text"
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(0); }}
            placeholder="Action (e.g. USER_LOGIN)"
            className="p-2 glass-input text-xs w-48"
          />
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setPage(0); }}
            placeholder="Username"
            className="p-2 glass-input text-xs w-40"
          />
        </div>

        {/* Exporters */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 bg-slate-900 border border-white/10 hover:bg-white/5 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={() => handleExport('xls')}
            className="flex items-center gap-1.5 bg-slate-900 border border-white/10 hover:bg-white/5 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 bg-slate-900 border border-white/10 hover:bg-white/5 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="glass-panel p-6 flex flex-col justify-between min-h-[500px]">
        {isLoading ? (
          <div className="space-y-4 py-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Device/Client</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors text-slate-300">
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {log.user ? log.user.username : 'ANONYMOUS'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{log.ipAddress}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate" title={log.device}>{log.device}</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {log.transactionRef || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <Database className="w-10 h-10 text-slate-500 mb-2" />
            <span className="text-sm font-semibold text-slate-400">No logs found</span>
            <span className="text-xs text-muted mt-1">Try resetting search string filters.</span>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 text-xs">
            <span className="text-slate-400 font-medium">
              Page <b className="text-white">{page + 1}</b> of <b className="text-white">{totalPages}</b>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={page === 0}
                className="p-2 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page === totalPages - 1}
                className="p-2 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
