import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';
import { User, Shield, Key } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

type ProfileFields = z.infer<typeof profileSchema>;
type PasswordFields = z.infer<typeof passwordSchema>;

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileFields>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      email: user?.email || '',
    },
  });

  const {
    register: regPass,
    handleSubmit: handlePassSubmit,
    reset: resetPass,
    formState: { errors: passErrors, isSubmitting: passSubmitting },
  } = useForm<PasswordFields>({
    resolver: zodResolver(passwordSchema),
  });

  const onUpdateProfile = async (data: ProfileFields) => {
    try {
      await updateProfile(data);
      showToast('Profile updated successfully', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      showToast(msg, 'error');
    }
  };

  const onUpdatePassword = async (data: PasswordFields) => {
    try {
      await api.put('/api/v1/auth/change-password', data);
      showToast('Password changed successfully', 'success');
      resetPass();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Incorrect old password';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Side Tabs */}
      <div className="glass-panel p-4 flex flex-col gap-2 h-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold text-left transition-all ${
            activeTab === 'profile' ? 'bg-primary/20 text-white border-l-2 border-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          Edit Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold text-left transition-all ${
            activeTab === 'security' ? 'bg-primary/20 text-white border-l-2 border-primary' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          Password & Security
        </button>
      </div>

      {/* Settings Forms */}
      <div className="md:col-span-3 glass-panel p-6">
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 pb-3 border-b border-white/5">
              <User className="w-5 h-5 text-primary" /> Profile Configurations
            </h3>
            
            <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Username</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  className="w-full p-2.5 glass-input text-sm opacity-50 cursor-not-allowed"
                  disabled
                />
                <p className="text-[10px] text-muted mt-1">Username values cannot be modified on active accounts.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Full Name</label>
                <input
                  type="text"
                  {...regProfile('fullName')}
                  className="w-full p-2.5 glass-input text-sm"
                />
                {profileErrors.fullName && <p className="text-xs text-danger mt-1">{profileErrors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
                <input
                  type="email"
                  {...regProfile('email')}
                  className="w-full p-2.5 glass-input text-sm"
                />
                {profileErrors.email && <p className="text-xs text-danger mt-1">{profileErrors.email.message}</p>}
              </div>

              <button
                type="submit"
                disabled={profileSubmitting}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all hover-glow disabled:opacity-50 mt-2"
              >
                {profileSubmitting ? 'Saving changes...' : 'Save Settings'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2 pb-3 border-b border-white/5">
              <Key className="w-5 h-5 text-primary" /> Security Configurations
            </h3>

            <form onSubmit={handlePassSubmit(onUpdatePassword)} className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Current Password</label>
                <input
                  type="password"
                  {...regPass('oldPassword')}
                  className="w-full p-2.5 glass-input text-sm"
                  placeholder="••••••••"
                />
                {passErrors.oldPassword && <p className="text-xs text-danger mt-1">{passErrors.oldPassword.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">New Secure Password</label>
                <input
                  type="password"
                  {...regPass('newPassword')}
                  className="w-full p-2.5 glass-input text-sm"
                  placeholder="Minimum 6 characters"
                />
                {passErrors.newPassword && <p className="text-xs text-danger mt-1">{passErrors.newPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={passSubmitting}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold transition-all hover-glow disabled:opacity-50 mt-2"
              >
                {passSubmitting ? 'Updating credentials...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
