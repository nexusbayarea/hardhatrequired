'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'night' | 'day';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'night',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('night');

  useEffect(() => {
    // Read from localStorage on mount
    const saved = localStorage.getItem('iie-theme') as Theme | null;
    const initial: Theme = saved === 'day' ? 'day' : 'night';
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
