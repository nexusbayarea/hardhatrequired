'use client';

import { useLanguage } from '@/context/LanguageContext';

interface Props {
  mobile?: boolean;
}

export default function LanguageToggle({ mobile = false }: Props) {
  const { language, setLanguage } = useLanguage();
  const base = mobile
    ? 'block py-2 px-3 text-base font-semibold rounded-xl transition-colors'
    : 'text-2xl font-semibold uppercase tracking-wider rounded-lg transition-colors px-3 py-1.5';
  const active = { color: 'var(--color-text)' };
  const inactive = { color: 'var(--color-muted)' };

  const langDisplay: { code: 'en' | 'es' | 'zh' | 'vi'; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'zh', label: '中文' },
    { code: 'vi', label: 'VI' },
  ];

  return (
    <div className={`flex items-center flex-wrap ${mobile ? 'gap-0.5' : 'gap-2'}`}>
      {langDisplay.map((lang, i) => (
        <span key={lang.code} className="flex items-center">
          {i > 0 && <span className="shrink-0 px-1" style={{ color: 'var(--color-muted)', fontSize: '1.5rem', lineHeight: '1' }}>|</span>}
          <button
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={base}
            style={language === lang.code ? active : inactive}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}
