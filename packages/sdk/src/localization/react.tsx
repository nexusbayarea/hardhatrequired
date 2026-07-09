'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Language } from '../types';
import { t as resolveT } from './index';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({
  children,
  defaultLanguage = 'en',
}: {
  children: React.ReactNode;
  defaultLanguage?: Language;
}) {
  const [language, setLang] = useState<Language>(defaultLanguage);
  const [loading, setLoading] = useState(false);

  const setLanguage = useCallback(async (lang: Language) => {
    setLoading(true);
    setLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('iie-language', lang);
    }
    setLoading(false);
  }, []);

  const tFn = useCallback(
    (key: string) => resolveT(key, language),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: tFn, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
