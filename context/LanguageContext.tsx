'use client';

import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'es' | 'zh' | 'vi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const clientDictionary: Record<string, string> = {};

const coreDashboardPhrases = [
  'Active Bids', 'Compliance Alerts', 'Daily Intelligence', 'Win More Contracts',
  'Contractor Intelligence', 'OSHA Violation Risk', 'Elevator Inspection',
  'Emergency Generator Load Bank Testing', 'Grease Trap Compliance',
  'Backflow Certification Status', 'Fire Sprinkler Inspection Tracker',
  'Tier A Leads Found', 'Expiring State Licenses', 'Municipal Vendor Search Engine',
  'High Intent Demand Alerts', 'Search Radius', 'Select Index Type', 'Enter Zip Code',
];

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [, setTick] = useState(0);

  const setLanguage = async (targetLang: Language) => {
    if (targetLang === 'en') {
      setLanguageState('en');
      return;
    }

    setLoading(true);

    try {
      const sampleKey = `translation:${targetLang}:${coreDashboardPhrases[0].toLowerCase()}`;

      if (!clientDictionary[sampleKey]) {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: coreDashboardPhrases, target: targetLang }),
        });

        if (response.ok) {
          const data = await response.json();
          coreDashboardPhrases.forEach((phrase, index) => {
            const cacheKey = `translation:${targetLang}:${phrase.trim().toLowerCase()}`;
            clientDictionary[cacheKey] = data.translatedText[index];
          });
        }
      }

      setLanguageState(targetLang);
    } catch (err) {
      console.error('Failed to pre-hydrate language asset bundle:', err);
    } finally {
      setLoading(false);
      setTick((prev) => prev + 1);
    }
  };

  const t = (text: string): string => {
    if (language === 'en') return text;
    const lookupKey = `translation:${language}:${text.trim().toLowerCase()}`;
    return clientDictionary[lookupKey] || text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be run inside a LanguageProvider');
  return context;
};
