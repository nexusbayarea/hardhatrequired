'use client';

import { Bell } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import LanguageToggle from '@/components/shared/LanguageToggle';
import ThemeToggle from '@/components/shared/ThemeToggle';

interface TopbarProps {
  mobile?: boolean;
}

const WORKSPACE_LABELS: Record<string, string> = {
  'command-center': 'Command Center',
  'search': 'Search Intelligence',
  'logistics': 'Logistics Intelligence',
  'equipment': 'Equipment Exchange',
  'bids': 'Bid Intelligence',
  'market': 'Market Intelligence',
  'saved-searches': 'Saved Searches',
  'saved-vendors': 'Saved Vendors',
  'projects': 'Projects',
  'settings': 'Settings',
};

export default function Topbar({ mobile = false }: TopbarProps) {
  const { t } = useLanguage();
  const { workspace } = useWorkspace();

  /* ── Mobile: compact actions only (no search bar) ── */
  if (mobile) {
    return (
      <div className="flex items-center gap-3">
        <LanguageToggle />
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
      <div className="min-w-0 flex-1 overflow-hidden">
        <h1
          className="font-black leading-none truncate"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1.75rem',
            letterSpacing: '-0.01em',
            color: 'var(--color-text)',
          }}
        >
          {(WORKSPACE_LABELS[workspace] || t('dashboard')).toUpperCase()}
        </h1>
        <p className="text-sm font-medium mt-0.5 truncate" style={{ color: 'var(--color-muted)' }}>
          {workspace === 'command-center' ? t('construction market intelligence dashboard') :
           workspace === 'search' ? t('find operators, facilities, equipment, and regulatory records') :
           workspace === 'logistics' ? t('route analysis, cost modeling, and crew planning') :
           workspace === 'equipment' ? t('rental comparison, availability, and rate intelligence') :
           workspace === 'bids' ? t('scope analysis, cost breakdown, and proposal generation') :
           workspace === 'market' ? t('daily intelligence hub, bid feed, and market trends') :
           t('construction market intelligence')}
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
