import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';

interface User {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userDetails: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (details: { fullName: string; email: string }) => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Validate active session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await api.get('/api/v1/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Auth initialization failed", err);
          localStorage.clear();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const res = await api.post('/api/v1/auth/login', credentials);
      const { accessToken, refreshToken, userId, username, email, roles } = res.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser({ userId, username, email, fullName: res.data.fullName || username, roles });
    } finally {
      setLoading(false);
    }
  };

  const register = async (userDetails: any) => {
    setLoading(true);
    try {
      const res = await api.post('/api/v1/auth/register', userDetails);
      const { accessToken, refreshToken, userId, username, email, roles } = res.data;
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      setUser({ userId, username, email, fullName: res.data.fullName || username, roles });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (err) {
      console.warn("Logout request failed on server", err);
    } finally {
      localStorage.clear();
      setUser(null);
    }
  };

  const updateProfile = async (details: { fullName: string; email: string }) => {
    const res = await api.put('/api/v1/auth/profile', details);
    setUser(res.data);
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    const cleanRole = role.startsWith('ROLE_') ? role : `ROLE_${role.toUpperCase()}`;
    return user.roles.includes(cleanRole);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
