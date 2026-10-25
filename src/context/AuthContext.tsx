import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, studentApi } from '../api/client';

interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  detail: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  activeChild: any | null;
  childrenList: any[];
  demoAccounts: DemoAccount[];
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  switchPersona: (userId: string) => Promise<void>;
  setActiveChild: (child: any) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('educraft_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [activeChild, setActiveChild] = useState<any | null>(null);
  const [childrenList, setChildrenList] = useState<any[]>([]);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

  const fetchUserData = async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.user) {
        setUser(res.user);
        if (res.user.role === 'parent') {
          const chRes = await studentApi.getChildren();
          if (chRes.success && chRes.children.length > 0) {
            setChildrenList(chRes.children);
            setActiveChild(chRes.children[0]);
          }
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemos = async () => {
    try {
      const res = await authApi.getDemoAccounts();
      if (res.success) {
        setDemoAccounts(res.accounts);
      }
    } catch (e) {
      console.warn('Failed to fetch demo accounts:', e);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchDemos();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem('educraft_token', res.token);
      setToken(res.token);
      setUser(res.user);
      if (res.user.role === 'parent') {
        const chRes = await studentApi.getChildren();
        if (chRes.success && chRes.children.length > 0) {
          setChildrenList(chRes.children);
          setActiveChild(chRes.children[0]);
        }
      }
    }
  };

  const register = async (payload: any) => {
    const res = await authApi.register(payload);
    if (res.success && res.token) {
      localStorage.setItem('educraft_token', res.token);
      setToken(res.token);
      setUser(res.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('educraft_token');
    setToken(null);
    setUser(null);
    setActiveChild(null);
    setChildrenList([]);
  };

  const switchPersona = async (userId: string) => {
    setLoading(true);
    try {
      const res = await authApi.switchPersona(userId);
      if (res.success && res.token) {
        localStorage.setItem('educraft_token', res.token);
        setToken(res.token);
        setUser(res.user);
        if (res.user.role === 'parent') {
          const chRes = await studentApi.getChildren();
          if (chRes.success && chRes.children.length > 0) {
            setChildrenList(chRes.children);
            setActiveChild(chRes.children[0]);
          }
        } else {
          setActiveChild(null);
          setChildrenList([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    await fetchUserData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        activeChild,
        childrenList,
        demoAccounts,
        login,
        register,
        logout,
        switchPersona,
        setActiveChild,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
