import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate } from 'react-router-dom';
import { Landmark, ArrowRight, UserPlus } from 'lucide-react';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CUSTOMER', 'MANAGER', 'ADMIN']),
});

type RegisterFields = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: signup } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'CUSTOMER',
    },
  });

  const onSubmit = async (data: RegisterFields) => {
    try {
      // Map role to single entry array of roles for backend compatibility
      const payload = {
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        password: data.password,
        roles: [data.role],
      };
      await signup(payload);
      showToast('Account registered successfully', 'success');
      navigate('/');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Registration failed. Try again.';
      showToast(errMsg, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-6 grid-overlay bg-background">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel p-8 relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-primary/10 rounded-2xl mb-4 border border-primary/20">
            <UserPlus className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Open Bank Account</h1>
          <p className="text-sm text-muted text-center mt-1">Join TransactX Enterprise Banking System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
            <input
              type="text"
              {...register('fullName')}
              className="w-full p-2.5 glass-input text-sm"
              placeholder="Rishi Kumar"
            />
            {errors.fullName && <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
            <input
              type="email"
              {...register('email')}
              className="w-full p-2.5 glass-input text-sm"
              placeholder="rishi@transactx.com"
            />
            {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
            <input
              type="text"
              {...register('username')}
              className="w-full p-2.5 glass-input text-sm"
              placeholder="rishi123"
            />
            {errors.username && <p className="text-xs text-danger mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full p-2.5 glass-input text-sm"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">System Access Role</label>
            <select
              {...register('role')}
              className="w-full p-2.5 glass-input text-sm bg-slate-900 text-slate-100"
            >
              <option value="CUSTOMER" className="bg-slate-900 text-slate-100">Customer (Standard User)</option>
              <option value="MANAGER" className="bg-slate-900 text-slate-100">Manager (Read & Freeze access)</option>
              <option value="ADMIN" className="bg-slate-900 text-slate-100">Administrator (Full Dashboard & Exporter)</option>
            </select>
            {errors.role && <p className="text-xs text-danger mt-1">{errors.role.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 hover-glow disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {isSubmitting ? 'Provisioning core account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold ml-1">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
