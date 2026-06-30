'use client';

import { Bell } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';

interface TopbarProps {
  mobile?: boolean;
}

export default function Topbar({ mobile = false }: TopbarProps) {
  const { t } = useLanguage();

  /* ── Mobile: compact actions only (no search bar) ── */
  if (mobile) {
    return (
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          className="relative p-2.5 rounded-xl transition-all"
          style={{ background: 'var(--color-surface2)' }}
          aria-label="Notifications"
        >
          <Bell
            className="w-5 h-5"
            style={{ color: 'var(--color-muted)' }}
          />
          <span
            className="absolute top-2 right-2 w-2 h-2 rounded-full"
            style={{ background: 'var(--color-red)' }}
          />
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white"
          style={{ background: 'linear-gradient(135deg, var(--color-red), color-mix(in srgb, var(--color-red) 60%, black))' }}
        >
          U
        </div>
      </div>
    );
  }

  /* ── Desktop full topbar ── */
  return (
    <header
      className="h-20 border-b flex items-center justify-between px-8"
      style={{
        borderColor: 'var(--color-border)',
        background: 'color-mix(in srgb, var(--color-surface) 90%, transparent)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Page title — injected by route context in future, generic for now */}
      <div>
        <h1
          className="font-black leading-none"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1.75rem',
            letterSpacing: '-0.01em',
            color: 'var(--color-text)',
          }}
        >
          {t('dashboard').toUpperCase()}
        </h1>
        <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-muted)' }}>
          {t('construction market intelligence')}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <LanguageToggle />

        <ThemeToggle />

        <button
          className="relative p-2.5 rounded-xl transition-all"
          style={{ background: 'var(--color-surface2)' }}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
          <span
            className="absolute top-2 right-2 w-2 h-2 rounded-full"
            style={{ background: 'var(--color-red)' }}
          />
        </button>

        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm text-white"
          style={{ background: 'linear-gradient(135deg, var(--color-red), color-mix(in srgb, var(--color-red) 60%, black))' }}
        >
          U
        </div>
      </div>
    </header>
  );
}
