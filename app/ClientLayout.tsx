'use client';

import { LanguageProvider } from '../context/LanguageContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}
