import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Landmark, 
  LayoutDashboard, 
  Cpu, 
  FileText, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  User 
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    showToast('Signed out successfully', 'info');
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-primary/20 text-white border-l-2 border-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white';
  };

  const getRoleBadgeColor = () => {
    if (hasRole('ADMIN')) return 'bg-purple-950/80 border-purple-500/40 text-purple-300';
    if (hasRole('MANAGER')) return 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300';
    return 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300';
  };

  const getRoleLabel = () => {
    if (hasRole('ADMIN')) return 'System Admin';
    if (hasRole('MANAGER')) return 'Bank Manager';
    return 'Bank Customer';
  };

  return (
    <div className="min-h-screen flex bg-background relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/3 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar navigation */}
      <aside className="w-64 bg-slate-950/80 border-r border-white/5 flex flex-col z-20 backdrop-blur-xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Landmark className="w-6 h-6 text-primary" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight block">TransactX</span>
            <span className="text-[10px] text-muted tracking-wider uppercase font-semibold">Enterprise Core</span>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="p-4 mx-4 my-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary font-bold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold block truncate text-slate-100">{user.fullName}</span>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 border rounded-full mt-1 ${getRoleBadgeColor()}`}>
                {getRoleLabel()}
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-1">
          <Link to="/" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/')}`}>
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </Link>
          <Link to="/atm" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/atm')}`}>
            <Cpu className="w-4 h-4" />
            ATM Simulator
          </Link>

          {/* Supervisor view panels */}
          {(hasRole('MANAGER') || hasRole('ADMIN')) && (
            <>
              <div className="pt-4 pb-2 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Supervisor Options</div>
              <Link to="/admin" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/admin')}`}>
                <ShieldCheck className="w-4 h-4" />
                Admin Dashboard
              </Link>
              <Link to="/audit" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/audit')}`}>
                <FileText className="w-4 h-4" />
                Audit Logs
              </Link>
            </>
          )}

          <div className="pt-4 pb-2 px-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">Preferences</div>
          <Link to="/settings" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/settings')}`}>
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content body container */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10 p-8">
        <header className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {location.pathname === '/' && 'Financial Dashboard'}
              {location.pathname === '/atm' && 'ATM Operations Simulator'}
              {location.pathname === '/admin' && 'Enterprise System Monitor'}
              {location.pathname === '/audit' && 'Audit trail explorer'}
              {location.pathname === '/settings' && 'User Settings'}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {location.pathname === '/' && 'Core Ledger accounts and monthly trends'}
              {location.pathname === '/atm' && 'Withdraw, deposit, and transfer cash securely'}
              {location.pathname === '/admin' && 'Uptime metrics and lock concurrency comparing sandbox'}
              {location.pathname === '/audit' && 'Immutable system wide activity logs'}
              {location.pathname === '/settings' && 'Profile management and security configurations'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold bg-white/[0.02] border border-white/5 px-4 py-2 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            PostgreSQL: Connected
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            Redis: Active
          </div>
        </header>

        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
