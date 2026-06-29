'use client';

import { useState } from 'react';
import { Search, MapPin, Crosshair, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!zip.trim()) {
      setError('Enter a ZIP code to begin search.');
      return;
    }
    if (!vertical) {
      setError('Select an Index to search.');
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
            Market Search
          </div>
          <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-muted)' }}>
            Define your target market parameters
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
              Index
            </label>
            <select
              value={vertical}
              onChange={e => setVertical(e.target.value)}
              className="field-input"
            >
              <option value="" disabled>(Select)</option>
              <option value="asbestos_abatement">Asbestos & Lead Abatement</option>
              <option value="backflow_testing">Backflow Prevention Testing</option>
              <option value="grease_trap">Commercial Grease Trap Pumping</option>
              <option value="kitchen_exhaust">Commercial Kitchen Hood Degreasing</option>
              <option value="concrete">Concrete Services</option>
              <option value="elevator_inspection">Elevator Inspection & Certification</option>
              <option value="generator_testing">Emergency Generator Load Bank Testing</option>
              <option value="fire_extinguisher">Fire Extinguisher Inspection & Filling</option>
              <option value="fire_sprinkler">Fire Sprinkler Pressure Testing</option>
              <option value="marine_construction">Heavy Marine & Dock Infrastructure</option>
              <option value="hvac_balance">HVAC Test & Balance</option>
              <option value="hydro_excavation">Hydro-Excavation & Non-Destructive Digging</option>
              <option value="commercial_roofing">Industrial & Commercial Flat Roofing</option>
              <option value="scrap_metal">Industrial Scrap Metal Processing</option>
              <option value="industrial_wastewater">Industrial Wastewater Treatment</option>
              <option value="medical_waste">Medical Waste Disposal</option>
              <option value="slurry_concrete">Slurry</option>
              <option value="stormwater_compliance">Stormwater Compliance / SWPPP</option>
              <option value="tank_testing">Underground Tank Testing</option>
            </select>
          </div>

          {/* Radius */}
          <div>
            <label className="field-label">
              <MapPin className="w-4 h-4" />
              Radius
            </label>
            <select
              value={radius}
              onChange={e => setRadius(e.target.value)}
              className="field-input"
            >
              <option value="" disabled>(Select)</option>
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
              ZIP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={zip}
              onChange={e => setZip(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Enter ZIP code"
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
              {loading ? 'Scanning your market...' : 'Set parameters above and run discovery'}
            </div>
            {!loading && (
              <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Grading: <span style={{ color: 'var(--color-red)' }}>A</span> = Good to go{' '}
                <span style={{ color: 'var(--color-red)' }}>B</span> = Check website or call to verify{' '}
                <span style={{ color: 'var(--color-red)' }}>C</span> = Call to verify
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
              <><Loader2 className="w-5 h-5 animate-spin" /> Searching...</>
            ) : (
              <><Search className="w-5 h-5" /> Run Discovery</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
