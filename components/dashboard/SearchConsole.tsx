'use client';

import { useState } from 'react';
import { Search, MapPin, Crosshair, Droplets, Loader2 } from 'lucide-react';
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
  equipment: { title: 'Find Equipment Rentals', desc: 'Browse heavy equipment, vac trucks, and specialty tools.', placeholder: 'Equipment Search' },
  bids: { title: 'Bid Assistance', desc: 'Upload plans or describe scope to generate a vendor list and estimate.', placeholder: 'Bid Search' },
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
  const [gallons, setGallons] = useState('');
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = activePane === 'labor' || activePane === 'disposal' || activePane === 'equipment' || activePane === 'bids';

  const verticalOptions = Object.values(verticalMatrix)
    .map(v => ({
      value: v.id,
      label: activePane === 'disposal' ? v.disposalLabel : v.laborLabel,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

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
          ...(gallons ? { gallons: parseInt(gallons) } : {}),
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
      className="rounded-xl overflow-hidden bg-surface border border-border"
      data-agent-context="search-console"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center gap-4 bg-surface2">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            activePane === 'disposal' ? 'bg-disposal-mix' : 'bg-labor-mix'
          }`}
        >
          <Search className={`w-6 h-6 ${activePane === 'disposal' ? 'text-green' : 'text-red'}`} />
        </div>
        <div>
          <div className="font-black uppercase search-console-header-title">
            {t(meta.title)}
          </div>
          {meta.desc && (
            <div className="text-sm font-medium mt-0.5 text-muted">
              {t(meta.desc)}
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="p-6">
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${activePane === 'disposal' ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-5 mb-6`}>
          {/* Vertical */}
          <div>
            <label htmlFor="search-vertical-select" className="field-label">
              <Crosshair className="w-4 h-4" />
              {t('index')}
            </label>
            <select
              id="search-vertical-select"
              title={t('index')}
              value={vertical}
              onChange={e => setVertical(e.target.value)}
              className="field-input"
              disabled={!isActive}
              data-agent-intent="select-vertical"
              data-agent-type="dropdown"
            >
              <option value="" disabled>{t('(select)')}</option>
              {verticalOptions.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {vertical && verticalMatrix[vertical] && isActive && (
              <div className="mt-2 p-2 rounded-lg text-[10px] leading-relaxed bg-surface2 text-muted border border-border">
                {activePane === 'disposal' ? verticalMatrix[vertical].disposalDesc : verticalMatrix[vertical].laborDesc}
              </div>
            )}
          </div>

          {/* Radius */}
          <div>
            <label htmlFor="search-radius-select" className="field-label">
              <MapPin className="w-4 h-4" />
              {t('radius')}
            </label>
            <select
              id="search-radius-select"
              title={t('radius')}
              value={radius}
              onChange={e => setRadius(e.target.value)}
              className="field-input"
              disabled={!isActive}
              data-agent-intent="set-radius"
              data-agent-type="radius"
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
              data-agent-intent="set-zip"
              data-agent-type="zipcode"
            />
          </div>

          {/* Gallons (disposal mode only) */}
          {activePane === 'disposal' && (
            <div>
              <label className="field-label">
                <Droplets className="w-4 h-4" />
                {t('gallons')}
              </label>
              <input
                type="number"
                value={gallons}
                onChange={e => setGallons(e.target.value)}
                placeholder={t('est. volume')}
                className="field-input"
                disabled={!isActive}
                data-agent-intent="set-gallons"
                data-agent-unit="gallons"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-xl text-base font-semibold flex items-center gap-3 error-box">
            ⚠ {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm font-semibold text-muted">
            {loading ? t('scanning your market...') : isActive ? t('set parameters above and run discovery') : t('select a tab to begin')}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !isActive}
            className={`btn-primary w-full max-w-[280px] ${
              loading || !isActive ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'
            }`}
            data-agent-intent="execute-search"
          >
{loading ? (
  <><Loader2 className="w-5 h-5 animate-spin" /> {t('searching...')}</>
) : (
  <><Search className="w-5 h-5" /> {activePane === 'disposal' ? t('search disposal') : t('search labor')}</>
)}
          </button>
        </div>
      </div>
    </div>
  );
}
