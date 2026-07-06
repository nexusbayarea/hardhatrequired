'use client';

import { useLanguage } from '@/context/LanguageContext';
import { getFitTypeLabel } from '@/lib/results/groups';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';

interface Props {
  companies: SearchResult[];
  onFeedback?: (company: SearchResult, voteType: VoteType) => void;
}

export default function VendorComparison({ companies, onFeedback }: Props) {
  const { t } = useLanguage();

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
      <table className="w-full min-w-[700px]">
        <thead>
          <tr className="text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--color-surface2)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
            <th className="px-4 py-3 text-left">{t('vendor')}</th>
            <th className="px-4 py-3 text-left">{t('distance')}</th>
            <th className="px-4 py-3 text-left">{t('grade')}</th>
            <th className="px-4 py-3 text-left">{t('confidence')}</th>
            <th className="px-4 py-3 text-left">{t('fit')}</th>
            {(companies.some(c => c.logisticsEstimates)) && (
              <th className="px-4 py-3 text-right">{t('haul cost')}</th>
            )}
            {(companies.some(c => c.logisticsEstimates)) && (
              <th className="px-4 py-3 text-right">{t('total cost')}</th>
            )}
            {companies.some(c => c.permits && c.permits.length > 0) && (
              <th className="px-4 py-3 text-left">{t('permit')}</th>
            )}
            <th className="px-4 py-3 text-left">{t('contact')}</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((c, i) => (
            <tr
              key={c.id}
              className="text-sm transition-colors"
              style={{
                background: i % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface2)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <td className="px-4 py-3">
                <div className="font-semibold truncate max-w-[200px]" style={{ color: 'var(--color-text)' }}>
                  {c.companyName}
                </div>
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: 'var(--color-muted)' }}>
                {c.distanceMiles != null ? `${c.distanceMiles.toFixed(1)} ${t('mi')}` : '—'}
              </td>
              <td className="px-4 py-3">
                <span className="font-black" style={{
                  color: c.grade === 'A' ? 'var(--color-green)' : c.grade === 'B' ? 'var(--color-yellow)' : 'var(--color-muted)',
                }}>
                  {c.grade}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${c.confidence ?? 0}%`,
                      background: (c.confidence ?? 0) >= 70 ? 'var(--color-green)' : (c.confidence ?? 0) >= 40 ? 'var(--color-yellow)' : 'var(--color-muted)',
                    }} />
                  </div>
                  <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--color-muted)' }}>
                    {c.confidence ?? '—'}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>
                  {c.fitType ? getFitTypeLabel(c.fitType) : '—'}
                </span>
              </td>
              {c.logisticsEstimates && (
                <td className="px-4 py-3 text-right tabular-nums" style={{ color: 'var(--color-muted)' }}>
                  ${c.logisticsEstimates.haulingCost.toLocaleString()}
                </td>
              )}
              {c.logisticsEstimates && (
                <td className="px-4 py-3 text-right tabular-nums font-bold" style={{ color: 'var(--color-green)' }}>
                  ${c.logisticsEstimates.totalCost.toLocaleString()}
                </td>
              )}
              {c.permits && c.permits.length > 0 && (
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                    background: c.permits.some(p => p.status === 'Active') ? 'color-mix(in srgb, var(--color-green) 12%, transparent)' : 'color-mix(in srgb, var(--color-red) 12%, transparent)',
                    color: c.permits.some(p => p.status === 'Active') ? 'var(--color-green)' : 'var(--color-red)',
                  }}>
                    {c.permits.some(p => p.status === 'Active') ? '✓' : '✗'}
                  </span>
                </td>
              )}
              <td className="px-4 py-3">
                <div className="flex items-center gap-1">
                  {c.phone && (
                    <a href={`tel:${c.phone}`}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                      style={{ background: 'var(--color-surface)', color: 'var(--color-blue)', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}
                    >
                      📞
                    </a>
                  )}
                  {c.website && (
                    <a href={`https://${c.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors"
                      style={{ background: 'var(--color-surface)', color: 'var(--color-blue)', textDecoration: 'none' }}
                      onClick={e => e.stopPropagation()}
                    >
                      🔗
                    </a>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
