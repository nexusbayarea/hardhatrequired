'use client';

import { useState, useEffect } from 'react';
import { Database, Truck, Wrench, FileCheck, Briefcase, Users } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface CoverageData {
  companies: number;
  permits: number;
  equipment: number;
  bids: number;
  deepProfiles: number;
  states: number;
}

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function CoverageStatistics() {
  const { t } = useLanguage();
  const [data, setData] = useState<CoverageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/coverage', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && typeof d.companies === 'number') {
          setData(d as CoverageData);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!data && !loading) return null;

  const stats = data ? [
    { icon: Database, label: t('Companies Indexed'), value: formatCount(data.companies), color: 'var(--color-red)' },
    { icon: FileCheck, label: t('Active Permits'), value: formatCount(data.permits), color: 'var(--color-green)' },
    { icon: Wrench, label: t('Equipment Assets'), value: formatCount(data.equipment), color: 'var(--color-blue)' },
    { icon: Truck, label: t('Disposal Facilities'), value: formatCount(data.companies), color: 'var(--color-yellow)' },
    { icon: Briefcase, label: t('Open Bids'), value: formatCount(data.bids), color: 'var(--color-indigo)' },
    { icon: Users, label: t('Deep Profiles'), value: formatCount(data.deepProfiles), color: 'var(--color-green)' },
  ] : [];

  return (
    <section className="py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="mb-12">
          <p className="section-label mb-4">{t('live platform coverage')}</p>
          <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
            {t('your market,')}<br />
            <span style={{ color: 'var(--color-muted)' }}>{t('fully mapped.')}</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="relative p-6 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-8 translate-x-8 opacity-[0.04]"
                  style={{ background: stat.color }}
                />
                <Icon className="w-5 h-5 mb-3" style={{ color: stat.color }} />
                <div className="text-3xl font-black tabular-nums mb-1" style={{ color: 'var(--color-text)' }}>
                  {loading ? (
                    <span className="inline-block w-16 h-6 rounded animate-pulse" style={{ background: 'var(--color-surface2)' }} />
                  ) : stat.value}
                </div>
                <div className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
