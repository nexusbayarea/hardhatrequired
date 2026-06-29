'use client';

import { useLanguage } from '@/context/LanguageContext';

interface Props {
  mobile?: boolean;
}

export default function LanguageToggle({ mobile = false }: Props) {
  const { language, setLanguage } = useLanguage();
  const base = mobile
    ? 'block py-2 px-3 text-base font-semibold rounded-xl transition-colors'
    : 'text-sm font-semibold uppercase tracking-wider rounded-lg transition-colors px-2 py-2';
  const active = { color: 'var(--color-text)' };
  const inactive = { color: 'var(--color-muted)' };
  return (
    <div className={`flex items-center ${mobile ? 'gap-1' : 'gap-0'}`}>
      <button
        onClick={() => setLanguage('en')}
        className={base}
        style={language === 'en' ? active : inactive}
      >
        English
      </button>
      <span className="text-xs" style={{ color: 'var(--color-muted)' }}>/</span>
      <button
        onClick={() => setLanguage('es')}
        className={base}
        style={language === 'es' ? active : inactive}
      >
        Español
      </button>
    </div>
  );
}
