import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, ArrowRight, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFields = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    try {
      await login(data);
      showToast('Logged in successfully', 'success');
      navigate('/');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Invalid username or password';
      showToast(errMsg, 'error');
    }
  };

  // Helper function to autofill credentials for testing
  const autofillDemo = (role: 'customer' | 'admin') => {
    if (role === 'customer') {
      setValue('username', 'customer1');
      setValue('password', 'password');
    } else {
      setValue('username', 'admin1');
      setValue('password', 'password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6 grid-overlay bg-background">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary/10 rounded-2xl mb-4 border border-primary/20">
            <Landmark className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">TransactX Engine</h1>
          <p className="text-sm text-muted text-center mt-1">Enterprise Core ATM Transaction Simulator</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
            <input
              type="text"
              {...register('username')}
              className="w-full p-3 glass-input text-sm"
              placeholder="Enter your username"
            />
            {errors.username && <p className="text-xs text-danger mt-1.5">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full p-3 glass-input text-sm"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-danger mt-1.5">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 hover-glow disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? 'Verifying session...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo profiles quick installer */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Autofill Demo Profiles</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => autofillDemo('customer')}
              className="p-2 border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-200 text-center font-medium transition-all"
            >
              Demo Customer
            </button>
            <button
              onClick={() => autofillDemo('admin')}
              className="p-2 border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-200 text-center font-medium transition-all"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted">
            New customer?{' '}
            <Link to="/register" className="text-primary hover:underline font-semibold ml-1">
              Create an Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
