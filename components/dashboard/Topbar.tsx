'use client';

import { Bell, HardHat } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';

interface TopbarProps {
  mobile?: boolean;
}

export default function Topbar({ mobile = false }: TopbarProps) {
  const { t } = useLanguage();
  const { workspace } = useWorkspace();

  /* ── Mobile: compact actions only ── */
  if (mobile) {
    return (
      <div className="flex items-center gap-3">
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
        <LanguageToggle />
        <ThemeToggle />
      </div>
    );
  }

  /* ── Desktop full topbar — matches landing nav ── */
  return (
    <header
      className="h-20 border-b flex items-center justify-between px-8"
      style={{
        borderColor: 'var(--color-border)',
        background: 'color-mix(in srgb, var(--color-surface) 90%, transparent)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo — matches landing */}
      <Link href="/" className="flex items-center gap-3 shrink-0">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
          style={{ background: 'var(--color-red)' }}
        >
          <HardHat className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col leading-none">
          <span
            className="font-display text-2xl tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, letterSpacing: '-0.01em', color: 'var(--color-text)' }}
          >
            HHR
          </span>
          <span className="text-[15px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
            Hard Hat Required
          </span>
        </div>
      </Link>

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
