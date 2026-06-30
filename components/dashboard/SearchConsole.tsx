'use client';

import { useState } from 'react';
import { Search, MapPin, Crosshair, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import type { SearchResult } from '@/types/search';

interface SearchConsoleProps {
  onResults: (data: { companies: SearchResult[]; count: number; industry?: string }) => void;
  onSearchStart?: () => void;
  vertical?: string;
  onVerticalChange?: (v: string) => void;
  zip?: string;
  onZipChange?: (z: string) => void;
}

export default function SearchConsole({
  onResults,
  onSearchStart,
  vertical: controlledVertical,
  onVerticalChange,
  zip: controlledZip,
  onZipChange,
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

  const handleSearch = async () => {
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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
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
            background: 'color-mix(in srgb, var(--color-red) 12%, var(--color-surface))',
            border: '1px solid color-mix(in srgb, var(--color-red) 25%, var(--color-border))',
          }}
        >
          <Search className="w-6 h-6" style={{ color: 'var(--color-red)' }} />
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
            {t('market search')}
          </div>
          <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {t('define your target market parameters')}
          </div>
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
              >
                <option value="" disabled>{t('(select)')}</option>
              <option value="asbestos_abatement">{t('asbestos_abatement')}</option>
              <option value="backflow_testing">{t('backflow_testing')}</option>
              <option value="grease_trap">{t('grease_trap')}</option>
              <option value="kitchen_exhaust">{t('kitchen_exhaust')}</option>
              <option value="concrete">{t('concrete')}</option>
              <option value="elevator_inspection">{t('elevator_inspection')}</option>
              <option value="generator_testing">{t('generator_testing')}</option>
              <option value="fire_extinguisher">{t('fire_extinguisher')}</option>
              <option value="fire_sprinkler">{t('fire_sprinkler')}</option>
              <option value="marine_construction">{t('marine_construction')}</option>
              <option value="hvac_balance">{t('hvac_balance')}</option>
              <option value="hydro_excavation">{t('hydro_excavation')}</option>
              <option value="commercial_roofing">{t('commercial_roofing')}</option>
              <option value="scrap_metal">{t('scrap_metal')}</option>
              <option value="industrial_wastewater">{t('industrial_wastewater')}</option>
              <option value="medical_waste">{t('medical_waste')}</option>
              <option value="slurry_concrete">{t('slurry_concrete')}</option>
              <option value="stormwater_compliance">{t('stormwater_compliance')}</option>
              <option value="tank_testing">{t('tank_testing')}</option>
            </select>
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
            />
          </div>

        </div>

        {/* Error */}
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

        {/* Run button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div
              className="text-sm font-semibold"
              style={{ color: 'var(--color-muted)' }}
            >
              {loading ? t('scanning your market...') : t('set parameters above and run discovery')}
            </div>
            {!loading && (
              <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {t('grading:')} <span style={{ color: 'var(--color-red)' }}>A</span>{t(' = good to go')}{' '}
                <span style={{ color: 'var(--color-red)' }}>B</span>{t(' = check website or call to verify')}{' '}
                <span style={{ color: 'var(--color-red)' }}>C</span>{t(' = call to verify')}
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              maxWidth: '280px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {t('searching...')}</>
            ) : (
              <><Search className="w-5 h-5" /> {t('run discovery')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
