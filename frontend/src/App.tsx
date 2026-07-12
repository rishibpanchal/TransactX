import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AtmSimulator } from './pages/AtmSimulator';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { ShieldAlert, Home } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component for authenticated routes
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Waking Bank Engine Core...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole) && !hasRole('ADMIN')) {
    return <Navigate to="/403" replace />;
  }

  return <Layout>{children}</Layout>;
};

// 403 Forbidden Error screen
const ForbiddenPage: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
    <ShieldAlert className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">403 - Access Denied</h1>
    <p className="text-sm text-slate-400 max-w-sm mb-6">
      Your user profile does not hold the clearance required to read this ledger action.
    </p>
    <a href="/" className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-5 py-2.5 rounded-lg text-xs font-bold transition-all">
      <Home className="w-4 h-4" /> Back to Dashboard
    </a>
  </div>
);

// 404 Page Not Found screen
const NotFoundPage: React.FC = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
    <ShieldAlert className="w-16 h-16 text-slate-500 mb-4" />
    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">404 - Terminal Missing</h1>
    <p className="text-sm text-slate-400 max-w-sm mb-6">
      The requested route path does not link to an active ATM simulation coordinate.
    </p>
    <a href="/" className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-5 py-2.5 rounded-lg text-xs font-bold transition-all">
      <Home className="w-4 h-4" /> Back to Dashboard
    </a>
  </div>
);

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/403" element={<ForbiddenPage />} />

              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/atm" element={<ProtectedRoute><AtmSimulator /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              
              {/* Supervisor Protected Routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requiredRole="MANAGER"><AdminDashboard /></ProtectedRoute>
                } 
              />
              <Route 
                path="/audit" 
                element={
                  <ProtectedRoute requiredRole="MANAGER"><AuditLogs /></ProtectedRoute>
                } 
              />

              {/* Catch all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
