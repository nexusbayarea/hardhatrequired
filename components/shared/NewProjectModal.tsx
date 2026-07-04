'use client';

import { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { verticalMatrix } from '@/lib/verticals/matrix';

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    vertical: string;
    zip: string;
    volume: number;
    contractRevenue: number;
  }) => void;
  defaultVertical?: string;
  defaultZip?: string;
  defaultVolume?: number;
}

export default function NewProjectModal({
  open, onClose, onSubmit,
  defaultVertical = 'slurry_processing',
  defaultZip = '94538',
  defaultVolume = 10000,
}: NewProjectModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [vertical, setVertical] = useState(defaultVertical);
  const [zip, setZip] = useState(defaultZip);
  const [volume, setVolume] = useState(defaultVolume);
  const [revenue, setRevenue] = useState(Math.round(defaultVolume * 0.9));
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = () => {
    if (!name.trim()) { setError(t('project name required')); return; }
    setError(null);
    onSubmit({
      name: name.trim(),
      vertical,
      zip: zip.trim() || '94538',
      volume,
      contractRevenue: revenue,
    });
    setName('');
    setRevenue(Math.round(volume * 0.9));
  };

  const verticalOptions = Object.values(verticalMatrix)
    .map(v => ({ value: v.id, label: v.laborLabel }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="max-w-md w-full rounded-xl p-6 space-y-4 shadow-2xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderPlus className="w-4 h-4" style={{ color: 'var(--color-blue)' }} />
            {t('initialize project workspace')}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>
              {t('project name')}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('e.g. Tesla Fremont Slurry Removal')}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>
                {t('vertical')}
              </label>
              <select
                value={vertical}
                onChange={e => setVertical(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
              >
                {verticalOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>
                {t('zip code')}
              </label>
              <input
                type="text"
                value={zip}
                onChange={e => setZip(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>
                {t('volume (gal)')}
              </label>
              <input
                type="number"
                value={volume}
                onChange={e => setVolume(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>
                {t('contract revenue ($)')}
              </label>
              <input
                type="number"
                value={revenue}
                onChange={e => setRevenue(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs font-semibold" style={{ color: 'var(--color-red)' }}>
              {error}
            </div>
          )}
        </div>

        <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold transition-colors"
            style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors"
            style={{ background: 'var(--color-blue)' }}
          >
            {t('create workspace')}
          </button>
        </div>
      </div>
    </div>
  );
}
