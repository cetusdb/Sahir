'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { setAuth as saveAuth, clearAuth as clearAuthStorage, getUser } from './api';

export type AuthUser = { userId: number; username: string; role: string } | null;

type AuthContextType = {
  user: AuthUser;
  ready: boolean;          // localStorage okunup hidrasyon tamamlandı mı
  login: (token: string, u: NonNullable<AuthUser>) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  ready: false,
  login: () => {},
  logout: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [ready, setReady] = useState(false);

  // İlk mount'ta localStorage'ı oku ve diğer sekmelerle senkron tut
  useEffect(() => {
    setUser(getUser());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'sahir_token' || e.key === 'sahir_user' || e.key === null) {
        setUser(getUser());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback((token: string, u: NonNullable<AuthUser>) => {
    saveAuth(token, u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}