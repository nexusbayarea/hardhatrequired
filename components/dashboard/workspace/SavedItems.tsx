'use client';

import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, Folder, Clock, MapPin, Database, Play, Trash2, Search } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface SavedItemsProps {
  type: 'saved-searches' | 'saved-vendors' | 'projects';
}

interface SavedSearch {
  id: string;
  name: string;
  verticalId: string;
  zipCode: string;
  radiusMiles: number;
  resultCount: number;
  createdAt: string;
}

export default function SavedItems({ type }: SavedItemsProps) {
  const { t } = useLanguage();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (type === 'saved-searches') {
      fetchSavedSearches();
    } else {
      setLoading(false);
    }
  }, [type]);

  async function fetchSavedSearches() {
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      const data = await res.json();
      setSearches(data.searches || []);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }

  async function deleteSearch(id: string) {
    try {
      await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      setSearches(prev => prev.filter(s => s.id !== id));
    } catch {
      /* silently fail */
    }
  }

  async function replaySearch(search: SavedSearch) {
    try {
      await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-iie-client-context': search.verticalId,
        },
        body: JSON.stringify({ zip: search.zipCode, radius: search.radiusMiles }),
      });
    } catch {
      /* silently fail */
    }
  }

  if (type !== 'saved-searches') {
    const config = {
      'saved-vendors': { icon: BookmarkCheck, label: 'saved vendors', desc: 'Your bookmarked vendors, facilities, and operators will appear here once you save them from search results.' },
      'projects': { icon: Folder, label: 'projects', desc: 'Your active and archived projects will appear here. Create a project from the sidebar to get started.' },
    }[type];

    const Icon = config!.icon;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            {t(config!.label)}
          </h1>
        </div>
        <div
          className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Icon className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
          <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{t(config!.label)}</div>
          <div className="text-sm max-w-md" style={{ color: 'var(--color-muted)' }}>
            {t(config!.desc)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            {t('saved searches')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {searches.length} saved {searches.length === 1 ? 'search' : 'searches'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center" style={{ color: 'var(--color-muted)' }}>Loading...</div>
      ) : searches.length === 0 ? (
        <div
          className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Search className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
          <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{t('no saved searches')}</div>
          <div className="text-sm max-w-md" style={{ color: 'var(--color-muted)' }}>
            {t('Run a search from the dashboard and save it to see it here.')}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map(search => (
            <div
              key={search.id}
              className="rounded-xl p-5 transition-all hover:opacity-90"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{search.name}</h3>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0"
                      style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}
                    >
                      {search.verticalId.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm" style={{ color: 'var(--color-muted)' }}>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {search.zipCode} &mdash; {search.radiusMiles}mi
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="w-3.5 h-3.5" />
                      {search.resultCount} results
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(search.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button
                    onClick={() => replaySearch(search)}
                    className="rounded-lg p-2 transition-all hover:opacity-80"
                    style={{ background: 'var(--color-surface2)' }}
                    title="Replay search"
                  >
                    <Play className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                  </button>
                  <button
                    onClick={() => deleteSearch(search.id)}
                    className="rounded-lg p-2 transition-all hover:opacity-80"
                    style={{ background: 'var(--color-surface2)' }}
                    title="Delete search"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: 'var(--color-red)' }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
