'use client';

import { useState } from 'react';
import { Search, MapPin, Crosshair, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { verticalMatrix } from '@/lib/verticals/matrix';
import type { SearchResult } from '@/types/search';

export type SearchPane = 'labor' | 'disposal' | 'equipment' | 'bids';

interface SearchConsoleProps {
  onResults: (data: { companies: SearchResult[]; count: number; industry?: string }) => void;
  onError?: (error: string) => void;
  onSearchStart?: () => void;
  vertical?: string;
  onVerticalChange?: (v: string) => void;
  zip?: string;
  onZipChange?: (z: string) => void;
  activePane: SearchPane;
}

const PANE_META: Record<SearchPane, { title: string; desc: string; placeholder: string }> = {
  labor: { title: 'Find Contractors / Operators', desc: 'Search certified crews, operators, and specialty contractors.', placeholder: 'Labor Search' },
  disposal: { title: 'Find Disposal Facilities', desc: 'Search permitted facilities, reclamation yards, and tipping sites.', placeholder: 'Disposal Search' },
  equipment: { title: 'Equipment', desc: '', placeholder: 'Equipment Search' },
  bids: { title: 'Bids', desc: '', placeholder: 'Bids' },
};

export default function SearchConsole({
  onResults,
  onError,
  onSearchStart,
  vertical: controlledVertical,
  onVerticalChange,
  zip: controlledZip,
  onZipChange,
  activePane,
}: SearchConsoleProps) {
  const [internalVertical, setInternalVertical] = useState('');
  const [internalZip, setInternalZip] = useState('');

  const vertical = controlledVertical ?? internalVertical;
  const setVertical = onVerticalChange ?? setInternalVertical;
  const zip = controlledZip ?? internalZip;
  const setZip = onZipChange ?? setInternalZip;

  const [radius, setRadius] = useState('');
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = activePane === 'labor' || activePane === 'disposal';

  const verticalOptions = Object.values(verticalMatrix).map(v => ({
    value: v.id,
    label: activePane === 'disposal' ? v.disposalLabel : v.laborLabel,
  }));

  const meta = PANE_META[activePane];

  const handleSearch = async () => {
    if (!isActive) return;
    if (!zip.trim()) {
      setError(t('enter a zip code to begin search.'));
      return;
    }
    if (!vertical) {
      setError(t('select an index to search.'));
      return;
    }

    setLoading(true);
    setError(null);
    onSearchStart?.();

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: zip.trim(),
          radius: parseInt(radius),
          vertical,
          mode: activePane,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        onError?.(data.error || 'Search failed');
        return;
      }
      onResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div
        className="px-6 py-5 border-b flex items-center gap-4"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: activePane === 'disposal'
              ? 'color-mix(in srgb, var(--color-green) 12%, var(--color-surface))'
              : 'color-mix(in srgb, var(--color-red) 12%, var(--color-surface))',
            border: activePane === 'disposal'
              ? '1px solid color-mix(in srgb, var(--color-green) 25%, var(--color-border))'
              : '1px solid color-mix(in srgb, var(--color-red) 25%, var(--color-border))',
          }}
        >
          <Search className="w-6 h-6" style={{ color: activePane === 'disposal' ? 'var(--color-green)' : 'var(--color-red)' }} />
        </div>
        <div>
          <div
            className="font-black uppercase tracking-wider"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1.25rem',
              color: 'var(--color-text)',
              letterSpacing: '0.04em',
            }}
          >
            {meta.title}
          </div>
          {meta.desc && (
            <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-muted)' }}>
              {meta.desc}
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
          {/* Vertical */}
          <div>
            <label className="field-label">
              <Crosshair className="w-4 h-4" />
              {t('index')}
            </label>
            <select
              value={vertical}
              onChange={e => setVertical(e.target.value)}
              className="field-input"
              disabled={!isActive}
            >
              <option value="" disabled>{t('(select)')}</option>
              {verticalOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {vertical && verticalMatrix[vertical] && isActive && (
              <div className="mt-2 p-2 rounded-lg text-[10px] leading-relaxed" style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
                {activePane === 'disposal' ? verticalMatrix[vertical].disposalDesc : verticalMatrix[vertical].laborDesc}
              </div>
            )}
          </div>

          {/* Radius */}
          <div>
            <label className="field-label">
              <MapPin className="w-4 h-4" />
              {t('radius')}
            </label>
            <select
              value={radius}
              onChange={e => setRadius(e.target.value)}
              className="field-input"
              disabled={!isActive}
            >
              <option value="" disabled>{t('(select)')}</option>
              <option value="10">10 miles</option>
              <option value="20">20 miles</option>
              <option value="50">50 miles</option>
              <option value="100">100 miles</option>
            </select>
          </div>

          {/* ZIP */}
          <div>
            <label className="field-label">
              <MapPin className="w-4 h-4" />
              {t('zip code')}
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={zip}
              onChange={e => setZip(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={t('enter zip code')}
              className="field-input"
              disabled={!isActive}
            />
          </div>
        </div>

        {error && (
          <div
            className="mb-5 p-4 rounded-xl text-base font-semibold flex items-center gap-3"
            style={{
              background: 'color-mix(in srgb, var(--color-red) 10%, var(--color-surface2))',
              border: '1px solid color-mix(in srgb, var(--color-red) 30%, transparent)',
              color: 'var(--color-red)',
            }}
          >
            ⚠ {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div
            className="text-sm font-semibold"
            style={{ color: 'var(--color-muted)' }}
          >
            {loading ? t('scanning your market...') : isActive ? t('set parameters above and run discovery') : t('select a tab to begin')}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !isActive}
            className="btn-primary"
            style={{
              width: '100%',
              maxWidth: '280px',
              opacity: loading || !isActive ? 0.5 : 1,
              cursor: loading || !isActive ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {t('searching...')}</>
            ) : (
              <><Search className="w-5 h-5" /> {activePane === 'disposal' ? 'Search Disposal' : 'Search Labor'}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
