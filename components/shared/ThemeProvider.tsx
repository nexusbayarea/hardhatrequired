'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'night' | 'day';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'day',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('day');

  useEffect(() => {
    // Read from localStorage on mount
    const saved = localStorage.getItem('iie-theme') as Theme | null;
    const initial: Theme = saved === 'night' ? 'night' : 'day';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'night' ? 'day' : 'night';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('iie-theme', next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
