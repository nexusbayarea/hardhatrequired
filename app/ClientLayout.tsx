'use client';

import { LanguageProvider } from '../context/LanguageContext';
import { LayoutProvider } from '@iie/layout-engine/react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </LayoutProvider>
  );
}
