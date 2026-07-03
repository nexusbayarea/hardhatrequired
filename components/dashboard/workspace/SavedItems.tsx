'use client';

import { Bookmark, BookmarkCheck, Folder } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface SavedItemsProps {
  type: 'saved-searches' | 'saved-vendors' | 'projects';
}

export default function SavedItems({ type }: SavedItemsProps) {
  const { t } = useLanguage();

  const config = {
    'saved-searches': { icon: Bookmark, label: 'saved searches', desc: 'Your saved search configurations will appear here.' },
    'saved-vendors': { icon: BookmarkCheck, label: 'saved vendors', desc: 'Your bookmarked vendors, facilities, and operators will appear here.' },
    'projects': { icon: Folder, label: 'projects', desc: 'Your active and archived projects will appear here.' },
  }[type];

  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          {t(config.label)}
        </h1>
      </div>

      <div
        className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Icon className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
        <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{t(config.label)}</div>
        <div className="text-sm max-w-md" style={{ color: 'var(--color-muted)' }}>
          {t(config.desc)}
        </div>
      </div>
    </div>
  );
}
