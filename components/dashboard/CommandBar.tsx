'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function CommandBar() {
  const { t } = useLanguage();
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${focused ? 'var(--color-red)' : 'var(--color-border)'}`,
      }}
      data-agent-context="foreman-console"
    >
      <div className="flex items-center gap-3 px-5 py-3.5">
        <Sparkles className="w-5 h-5 shrink-0" style={{ color: 'var(--color-muted)' }} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => e.key === 'Enter' && value.trim() && setValue('')}
          placeholder={t('ask foreman...')}
          className="flex-1 bg-transparent text-sm font-medium focus:outline-none"
          style={{ color: 'var(--color-text)' }}
          data-agent-intent="execute-foreman-command"
        />
        <kbd className="hidden md:inline-flex text-xs font-bold px-1.5 py-0.5 rounded"
          style={{
            background: 'var(--color-surface2)',
            color: 'var(--color-muted)',
            border: '1px solid var(--color-border)',
          }}
        >
          ⌘K
        </kbd>
      </div>
      {!value && (
        <div
          className="px-5 pb-3 text-[11px] font-medium flex items-center gap-4"
          style={{ color: 'var(--color-muted)' }}
        >
          <span>{t('try: find slurry disposal near fremont')}</span>
          <span className="hidden sm:inline">{t('show disposal only')}</span>
          <span className="hidden lg:inline">{t('increase radius to 50 mi')}</span>
        </div>
      )}
    </div>
  );
}
