// frontend/lib/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, clearStoredTokens, setStoredTokens } from './api-client';
import { AuthResponse, User, UserRole } from '@/types/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const redirectByRole = useCallback((role: UserRole) => {
    switch (role) {
      case 'OFFICER':
        router.push('/officer/dashboard');
        break;
      case 'SUPERVISOR':
        router.push('/supervisor/dashboard');
        break;
      case 'STUDENT':
      default:
        router.push('/student/dashboard');
        break;
    }
  }, [router]);

  const checkAuth = useCallback(async () => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      const token = localStorage.getItem('access_token');
      if (token && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Verify with /auth/me in background
        apiClient
          .get<User>('/auth/me')
          .then((verified) => {
            const updated = { ...parsed, ...verified };
            setUser(updated);
            localStorage.setItem('auth_user', JSON.stringify(updated));
          })
          .catch(() => {
            // Ignore
          });
      }
    } catch {
      clearStoredTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        const token = localStorage.getItem('access_token');
        if (token && storedUser && isMounted) {
          setUser(JSON.parse(storedUser));
        }
      } catch {
        clearStoredTokens();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    setStoredTokens(res.accessToken, res.refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
    setUser(res.user);

    redirectByRole(res.user.role);
    return res.user;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      clearStoredTokens();
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
