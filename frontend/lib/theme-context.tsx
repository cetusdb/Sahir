'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';

export type Theme = 'default' | 'christmas' | 'halloween' | 'valentines';

const STORAGE_PREFIX = 'sahir_theme';

type ThemeContextType = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'default',
  setTheme: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const [theme, setThemeState] = useState<Theme>('default');

  // Kullanıcıya özgü key — giriş yapmamış olsa bile global tema saklayabilir
  const storageKey = user
    ? `${STORAGE_PREFIX}_user_${user.userId}`
    : `${STORAGE_PREFIX}_guest`;

  // Kullanıcı veya hidrasyon değişince tema yükle
  useEffect(() => {
    if (!ready) return;
    const saved = (localStorage.getItem(storageKey) as Theme | null) ?? 'default';
    apply(saved);
    setThemeState(saved);
  }, [ready, storageKey]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(storageKey, t);
    apply(t);
  }, [storageKey]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function apply(t: Theme) {
  if (typeof document === 'undefined') return;
  if (t === 'default') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
}

export function useTheme() {
  return useContext(ThemeContext);
}
