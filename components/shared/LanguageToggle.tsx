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

  const langDisplay: { code: 'en' | 'es' | 'zh' | 'vi'; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'es', label: 'ES' },
    { code: 'zh', label: '中文' },
    { code: 'vi', label: 'VI' },
  ];

  return (
    <div className={`flex items-center flex-wrap ${mobile ? 'gap-0.5' : 'gap-0'}`}>
      {langDisplay.map((lang, i) => (
        <span key={lang.code} className="flex items-center">
          {i > 0 && <span className="text-xs shrink-0" style={{ color: 'var(--color-muted)' }}>|</span>}
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
