'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useProject } from '@/context/ProjectContext';

export default function IntelligenceRail() {
  const { t } = useLanguage();
  const { projects } = useProject();
  const [reportData, setReportData] = useState<{
    totalCompanies?: number;
    activePermits?: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Intelligence Rail' }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setReportData(data);
      })
      .catch(() => {});
  }, []);

  const totalCompanies = reportData?.totalCompanies || projects.length * 5;
  const activePermits = reportData?.activePermits || 0;
  const openBids = reportData?.totalCompanies
    ? Math.round(reportData.totalCompanies * 0.4)
    : projects.length * 2;

  return (
    <div className="space-y-5">
      {/* Daily Intelligence Hub */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div
          className="px-4 py-3 border-b flex items-center gap-2"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface2)',
          }}
        >
          <span className="text-base" style={{ filter: 'saturate(0.5)' }}>📊</span>
          <span
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: 'var(--color-muted)' }}
          >
            {t('daily intelligence hub')}
          </span>
        </div>

        {/* New Bids */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-red)' }}>
              {t('active projects')}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--color-red) 12%, transparent)', color: 'var(--color-red)' }}>
              {projects.length}
            </span>
          </div>
          <div className="space-y-2">
            {projects.slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                    {p.name}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                    {p.vertical.replace(/_/g, ' ')} · {p.volume.toLocaleString()} gal
                  </div>
                </div>
                <span className="text-xs font-bold tabular-nums shrink-0 ml-2" style={{ color: 'var(--color-green)' }}>
                  ${(p.contractRevenue || 0).toLocaleString()}
                </span>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {t('create a project to see it here')}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="px-4 py-3">
          <span className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: 'var(--color-yellow)' }}>
            {t('market summary')}
          </span>
          <div className="space-y-2">
             <div className="flex items-start gap-2">
              <span className="text-[10px] mt-0.5 shrink-0">📈</span>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {totalCompanies} {t('companies in pipeline')}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                  {t('from market discovery engine')}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[10px] mt-0.5 shrink-0">⚖️</span>
              <div className="min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {activePermits} {t('active permits tracked')}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                  {t('regulatory compliance monitoring')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
          {t('region snapshot')}
        </span>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <div className="text-lg font-black tabular-nums" style={{ color: 'var(--color-text)' }}>{totalCompanies}</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>{t('active facilities')}</div>
          </div>
          <div>
            <div className="text-lg font-black tabular-nums" style={{ color: 'var(--color-green)' }}>{activePermits}</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>{t('permits expiring')}</div>
          </div>
          <div>
            <div className="text-lg font-black tabular-nums" style={{ color: 'var(--color-text)' }}>${openBids.toLocaleString()}</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>{t('open bids')}</div>
          </div>
          <div>
            <div className="text-lg font-black tabular-nums" style={{ color: 'var(--color-yellow)' }}>{projects.length}</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>{t('active projects')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
