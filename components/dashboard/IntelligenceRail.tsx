'use client';

import { useLanguage } from '@/context/LanguageContext';

const MOCK_BIDS = [
  { title: 'I-80 Concrete Slurry Removal', county: 'Alameda', amount: '$12,500' },
  { title: 'SFO Terminal 2 Dewatering', county: 'San Mateo', amount: '$8,200' },
  { title: 'Oakland Seaport Hazmat Remediation', county: 'Alameda', amount: '$34,000' },
];

const MOCK_ALERTS = [
  { title: 'SWPPP compliance changes', date: 'Jul 12', type: 'regulation' },
  { title: 'Bay Area tipping fees +7%', date: 'Jul 3', type: 'market' },
  { title: 'CSLB license renewal window', date: 'Aug 1', type: 'license' },
];

export default function IntelligenceRail() {
  const { t } = useLanguage();

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
              {t('new bids')}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--color-red) 12%, transparent)', color: 'var(--color-red)' }}>
              3
            </span>
          </div>
          <div className="space-y-2">
            {MOCK_BIDS.map((bid, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                    {bid.title}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                    {bid.county}
                  </div>
                </div>
                <span className="text-xs font-bold tabular-nums shrink-0 ml-2" style={{ color: 'var(--color-green)' }}>
                  {bid.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="px-4 py-3">
          <span className="text-[10px] font-black uppercase tracking-widest mb-2 block" style={{ color: 'var(--color-yellow)' }}>
            {t('alerts')}
          </span>
          <div className="space-y-2">
            {MOCK_ALERTS.map((alert, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] mt-0.5 shrink-0">
                  {alert.type === 'regulation' ? '⚖️' : alert.type === 'market' ? '📈' : '📋'}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text)' }}>
                    {alert.title}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                    {alert.date}
                  </div>
                </div>
              </div>
            ))}
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
            <div className="text-lg font-black tabular-nums" style={{ color: 'var(--color-text)' }}>47</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>{t('active facilities')}</div>
          </div>
          <div>
            <div className="text-lg font-black tabular-nums" style={{ color: 'var(--color-green)' }}>12</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>{t('permits expiring')}</div>
          </div>
          <div>
            <div className="text-lg font-black tabular-nums" style={{ color: 'var(--color-text)' }}>$2.4M</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>{t('open bids')}</div>
          </div>
          <div>
            <div className="text-lg font-black tabular-nums" style={{ color: 'var(--color-yellow)' }}>8</div>
            <div className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>{t('compliance alerts')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
