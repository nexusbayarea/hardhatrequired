'use client';

import { useState, useCallback } from 'react';
import {
  Search, MapPin, Crosshair, Droplets, Loader2, ChevronDown, ChevronUp,
  Filter, SlidersHorizontal, Shield, Star, ToggleLeft,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSearchState } from '@/context/SearchStateContext';
import { verticalMatrix } from '@/lib/verticals/matrix';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';

export type SearchMode = 'labor' | 'disposal' | 'equipment' | 'regulatory' | 'deep-profiles';

interface SearchIntelligenceProps {
  onResults: (data: { companies: SearchResult[]; count: number }) => void;
  onError?: (error: string) => void;
  onSearchStart?: () => void;
  vertical?: string;
  onVerticalChange?: (v: string) => void;
  onFeedback?: (company: SearchResult, voteType: VoteType) => void;
}

const MODE_META: Record<SearchMode, { title: string; desc: string; color: string; icon: typeof Search }> = {
  labor: { title: 'Labor / Operators', desc: 'Find certified crews, operators, and specialty contractors.', color: 'var(--color-red)', icon: Search },
  disposal: { title: 'Disposal Facilities', desc: 'Search permitted disposal sites, reclamation yards, and treatment facilities.', color: 'var(--color-green)', icon: Droplets },
  equipment: { title: 'Equipment Rentals', desc: 'Browse heavy equipment, vac trucks, and specialty tools by type and capacity.', color: 'var(--color-blue)', icon: Search },
  regulatory: { title: 'Regulatory / Permits', desc: 'Search regulated facilities with active permits, waste profiles, and compliance records.', color: 'var(--color-purple)', icon: Shield },
  'deep-profiles': { title: 'Deep Profiles', desc: 'View enriched company profiles with scraped services, equipment, license numbers, and AI summary.', color: 'var(--color-pink)', icon: Search },
};

export default function SearchIntelligence({
  onResults, onError, onSearchStart, vertical: controlledVertical, onVerticalChange, onFeedback,
}: SearchIntelligenceProps) {
  const { t } = useLanguage();
  const { activePane } = useSearchState();

  const [searchMode, setSearchMode] = useState<SearchMode>('disposal');
  const [internalVertical, setInternalVertical] = useState('');
  const [zip, setZip] = useState('94538');
  const [radius, setRadius] = useState('25');
  const [gallons, setGallons] = useState('10000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced filters
  const [minConfidence, setMinConfidence] = useState('0');
  const [directOperatorsOnly, setDirectOperatorsOnly] = useState(false);
  const [permitRequired, setPermitRequired] = useState(false);
  const [activePermitsOnly, setActivePermitsOnly] = useState(false);
  const [minRating, setMinRating] = useState('0');

  const vertical = controlledVertical ?? internalVertical;
  const setVertical = onVerticalChange ?? setInternalVertical;

  const meta = MODE_META[searchMode];

  const verticalOptions = Object.values(verticalMatrix)
    .map(v => ({
      value: v.id,
      label: searchMode === 'disposal' ? v.disposalLabel : v.laborLabel,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const handleSearch = async () => {
    if (!zip.trim()) { setError(t('enter a zip code')); return; }
    if (!vertical) { setError(t('select a vertical')); return; }

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
          mode: searchMode,
          gallons: searchMode === 'disposal' ? parseInt(gallons) : undefined,
          minConfidence: parseInt(minConfidence) || 0,
          directOperatorsOnly,
          permitRequired,
          activePermitsOnly,
          minRating: parseFloat(minRating) || 0,
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
    <div className="space-y-6">
      {/* Workspace header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          {t('search intelligence')}
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
          {t('find operators, disposal facilities, equipment, or regulatory records')}
        </p>
      </div>

      {/* Search mode tabs */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex overflow-x-auto" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {(Object.entries(MODE_META) as [SearchMode, typeof meta][]).map(([key, m]) => {
            const isActive = searchMode === key;
            return (
              <button
                key={key}
                onClick={() => setSearchMode(key)}
                className="flex-1 px-5 py-3.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0"
                style={{
                  background: isActive ? 'var(--color-surface2)' : 'transparent',
                  color: isActive ? m.color : 'var(--color-muted)',
                  borderBottom: isActive ? `2px solid ${m.color}` : '2px solid transparent',
                }}
              >
                <m.icon className="w-4 h-4" />
                {m.title}
              </button>
            );
          })}
        </div>

        {/* Search console */}
        <div className="p-6 space-y-5">
          {/* Core fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div>
              <label className="field-label">
                <Crosshair className="w-4 h-4" />
                {t('vertical')}
              </label>
              <select
                value={vertical}
                onChange={e => setVertical(e.target.value)}
                className="field-input"
                data-agent-intent="select-vertical"
              >
                <option value="" disabled>{t('(select)')}</option>
                {verticalOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">
                <MapPin className="w-4 h-4" />
                {t('zip code')}
              </label>
              <input
                type="text"
                value={zip}
                onChange={e => setZip(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="94538"
                className="field-input"
                data-agent-intent="set-zip"
              />
            </div>

            <div>
              <label className="field-label">
                <MapPin className="w-4 h-4" />
                {t('radius')}
              </label>
              <select
                value={radius}
                onChange={e => setRadius(e.target.value)}
                className="field-input"
                data-agent-intent="set-radius"
              >
                <option value="10">10 miles</option>
                <option value="15">15 miles</option>
                <option value="25">25 miles</option>
                <option value="40">40 miles</option>
                <option value="60">60 miles</option>
                <option value="100">100 miles</option>
              </select>
            </div>

            {searchMode === 'disposal' && (
              <div>
                <label className="field-label">
                  <Droplets className="w-4 h-4" />
                  {t('volume (gal)')}
                </label>
                <input
                  type="number"
                  value={gallons}
                  onChange={e => setGallons(e.target.value)}
                  className="field-input"
                  data-agent-intent="set-gallons"
                />
              </div>
            )}
          </div>

          {/* Advanced filters toggle */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-bold transition-colors"
              style={{ color: 'var(--color-muted)' }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {t('advanced filters')}
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAdvanced && (
              <div
                className="mt-4 p-5 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-5"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
              >
                <div>
                  <label className="field-label"><Filter className="w-3.5 h-3.5" />{t('min confidence')}</label>
                  <select value={minConfidence} onChange={e => setMinConfidence(e.target.value)} className="field-input">
                    <option value="0">Any</option>
                    <option value="50">50+</option>
                    <option value="70">70+</option>
                    <option value="85">85+</option>
                    <option value="95">95+</option>
                  </select>
                </div>

                <div>
                  <label className="field-label"><ToggleLeft className="w-3.5 h-3.5" />{t('operator type')}</label>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--color-text)' }}>
                      <input
                        type="checkbox"
                        checked={directOperatorsOnly}
                        onChange={e => setDirectOperatorsOnly(e.target.checked)}
                        className="accent-indigo-500"
                      />
                      {t('direct operators only')}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="field-label"><Shield className="w-3.5 h-3.5" />{t('permits')}</label>
                  <div className="flex flex-col gap-2 mt-2">
                    <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--color-text)' }}>
                      <input
                        type="checkbox"
                        checked={permitRequired}
                        onChange={e => setPermitRequired(e.target.checked)}
                        className="accent-indigo-500"
                      />
                      {t('permit required')}
                    </label>
                    {permitRequired && (
                      <label className="flex items-center gap-2 text-xs cursor-pointer pl-4" style={{ color: 'var(--color-muted)' }}>
                        <input
                          type="checkbox"
                          checked={activePermitsOnly}
                          onChange={e => setActivePermitsOnly(e.target.checked)}
                          className="accent-indigo-500"
                        />
                        {t('active permits only')}
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="field-label"><Star className="w-3.5 h-3.5" />{t('min rating')}</label>
                  <select value={minRating} onChange={e => setMinRating(e.target.value)} className="field-input">
                    <option value="0">Any</option>
                    <option value="3">3+ stars</option>
                    <option value="4">4+ stars</option>
                    <option value="4.5">4.5+ stars</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              className="p-4 rounded-xl text-sm font-semibold flex items-center gap-3"
              style={{
                background: 'color-mix(in srgb, var(--color-red) 10%, var(--color-surface2))',
                border: '1px solid color-mix(in srgb, var(--color-red) 30%, transparent)',
                color: 'var(--color-red)',
              }}
            >
              ⚠ {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <div className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
              {loading ? t('scanning your market...') : t('set parameters above and run discovery')}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary"
              style={{
                opacity: loading ? 0.5 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              data-agent-intent="execute-search"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {t('searching...')}</>
              ) : (
                <><Search className="w-5 h-5" /> {t('search')}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
