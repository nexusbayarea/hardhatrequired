'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, Phone, ExternalLink, Loader2, Search, MapPin, Globe, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Badge from '@/components/ui/Badge';
import { groupResults, getFitTypeLabel, FIT_ICONS } from '@/lib/results/groups';
import { getVerticalEstimatorConfig } from '@/lib/logistics/normalizer';
import { calculateHaulingCost } from '@/lib/logistics/cost-estimator';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';
import type { SearchPane } from './SearchConsole';

interface Contact {
  id: string;
  companyId: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  isPrimary: boolean;
}

interface ResultsTableProps {
  companies?: SearchResult[];
  contacts?: Contact[];
  loading?: boolean;
  vertical?: string;
  projectVolume?: number;
  onFeedback?: (company: SearchResult, voteType: VoteType) => void;
  activePane?: SearchPane;
}

const gradeColor = (g: string) => {
  switch (g?.toUpperCase()) {
    case 'A': return 'green';
    case 'B': return 'yellow';
    case 'C':
    case 'D': return 'default';
    default: return 'default';
  }
};

export default function ResultsTable({ companies, contacts: allContacts, loading, vertical, projectVolume, onFeedback, activePane }: ResultsTableProps) {
  const formatDistance = (d: number | null): string => {
    if (d == null) return '—';
    return `${d.toFixed(1)} ${t('mi')}`;
  };
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [voted, setVoted] = useState<Record<string, VoteType>>({});

  if (loading) {
    return (
      <div className="bg-surface rounded-3xl border border-border p-12 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-red animate-spin mb-4" />
        <div className="text-sm font-medium mb-1">{t('discovering companies...')}</div>
        <div className="text-xs text-muted">{t('searching, enriching contacts, detecting signals')}</div>
      </div>
    );
  }

  if (!companies?.length) {
    return (
      <div className="bg-surface rounded-3xl border border-border p-12 flex flex-col items-center justify-center text-center">
        <Search className="w-8 h-8 text-muted mb-4" />
        <div className="text-sm font-medium mb-1">{t('no results yet')}</div>
        <div className="text-xs text-muted">{t('set your parameters above and run a discovery search')}</div>
      </div>
    );
  }

  const handleVote = (company: SearchResult, voteType: VoteType) => {
    setVoted((prev) => ({ ...prev, [company.id]: voteType }));
    onFeedback?.(company, voteType);
  };

  return (
    <div className="bg-surface rounded-3xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
            <thead>
            <tr className="border-b border-border">
              {(
                activePane === 'disposal'
                  ? [t('company'), t('permit status'), t('distance'), t('score'), t('confidence'), t('signals'), t('accurate?'), '']
                  : [t('company'), t('grade'), t('distance'), t('score'), t('confidence'), t('signals'), t('accurate?'), '']
              ).map((h) => (
                <th key={h} className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupResults(companies, activePane).map((group) => (
              <Fragment key={group.fitType}>
                <tr
                  className="border-b border-t-2 border-border"
                  style={{ background: 'var(--color-surface2)' }}
                >
                  <td colSpan={8} className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{FIT_ICONS[group.fitType] ?? '📌'}</span>
                      <span
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {group.label}
                      </span>
                      <span
                        className="text-xs font-medium ml-1 px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}
                      >
                        {group.results.length}
                      </span>
                    </div>
                  </td>
                </tr>
                {group.results.map((company) => {
                  const isExpanded = expanded === company.id;
                  const currentVote = voted[company.id];

                  return (
                    <Fragment key={company.id}>
                      <tr
                        className="border-b border-border hover:bg-surface2 transition-colors cursor-pointer"
                        onClick={() => setExpanded(isExpanded ? null : company.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 max-w-[280px]">
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-muted shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted shrink-0" />}
                            <span className="text-sm font-semibold truncate">{company.companyName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={gradeColor(company.grade) as any}>{company.grade}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">{formatDistance(company.distanceMiles)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-surface2 overflow-hidden">
                              <div className="h-full bg-red rounded-full" style={{ width: `${company.leadScore}%` }} />
                            </div>
                            <span className="text-sm font-semibold">{company.leadScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 rounded-full bg-surface2 overflow-hidden">
                              <div className="h-full rounded-full" style={{
                                width: `${company.confidence ?? 0}%`,
                                background: (company.confidence ?? 0) >= 70
                                  ? 'var(--color-green)'
                                  : (company.confidence ?? 0) >= 40
                                    ? 'var(--color-yellow)'
                                    : 'var(--color-muted)',
                              }} />
                            </div>
                            <span className="text-sm font-semibold">{company.confidence ?? '—'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted max-w-[200px] truncate">
                          {company.capabilitySummary || '—'}
                        </td>
                        <td className="px-4 py-3">
                          {currentVote ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                              style={{
                                background: currentVote === 'accurate'
                                  ? 'color-mix(in srgb, var(--color-green) 12%, transparent)'
                                  : 'color-mix(in srgb, var(--color-red) 12%, transparent)',
                                color: currentVote === 'accurate'
                                  ? 'var(--color-green)'
                                  : 'var(--color-red)',
                              }}
                            >
                              {currentVote === 'accurate' ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                              {currentVote === 'accurate' ? t('accurate') : t('bad')}
                            </span>
                          ) : (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleVote(company, 'accurate'); }}
                                className="p-1.5 rounded-lg text-xs transition-all hover:scale-105 hover:bg-green/10 hover:text-green text-muted"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleVote(company, 'bad'); }}
                                className="p-1.5 rounded-lg text-xs transition-all hover:scale-105 hover:bg-red/10 hover:text-red text-muted"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <a
                              href={company.phone ? `tel:${company.phone}` : '#'}
                              onClick={(e) => e.stopPropagation()}
                              className={`p-1.5 rounded-lg transition-all ${company.phone ? 'hover:bg-surface2 text-muted hover:text-green' : 'text-border cursor-not-allowed'}`}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={company.website ? `https://${company.website.replace(/^https?:\/\//, '')}` : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`p-1.5 rounded-lg transition-all ${company.website ? 'hover:bg-surface2 text-muted hover:text-text' : 'text-border cursor-not-allowed'}`}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <div className="border-t border-border bg-surface2/50">
                              <div className="p-5 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                  <div className="space-y-2">
                                    <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('contact')}</div>
                                    {company.address && (
                                      <div className="flex items-start gap-2 text-sm">
                                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--color-blue)' }} />
                                        <a
                                          href={company.coordinates
                                            ? `https://www.google.com/maps/search/?api=1&query=${company.coordinates.lat},${company.coordinates.lng}`
                                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.address)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue hover:underline"
                                        >
                                          {company.address}
                                        </a>
                                      </div>
                                    )}
                                    {company.phone && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-blue)' }} />
                                        <a href={`tel:${company.phone}`} className="text-blue hover:underline">{company.phone}</a>
                                      </div>
                                    )}
                                    {company.website && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-blue)' }} />
                                        <a href={`https://${company.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline truncate">{company.website}</a>
                                      </div>
                                    )}
                                    {company.email && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <svg className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-blue)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        <a href={`mailto:${company.email}`} className="text-blue hover:underline truncate">{company.email}</a>
                                      </div>
                                    )}
                                    {company.googleRating != null && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <span className="text-xs" style={{ color: 'var(--color-yellow)' }}>
                                          ★ {company.googleRating.toFixed(1)} {company.googleReviewCount != null ? `(${company.googleReviewCount})` : ''}
                                        </span>
                                      </div>
                                    )}
                                    {company.relevanceReason && (
                                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                        {company.relevanceReason}
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('lead score')}</div>
                                    <div className="flex items-center gap-3">
                                      <div className="w-full max-w-[120px] h-2 rounded-full bg-surface2 overflow-hidden">
                                        <div className="h-full bg-red rounded-full" style={{ width: `${company.leadScore}%` }} />
                                      </div>
                                      <span className="text-lg font-bold">{company.leadScore}</span>
                                      <Badge variant={gradeColor(company.grade) as any}>{company.grade}</Badge>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('distance')}</div>
                                    <div className="text-sm">{formatDistance(company.distanceMiles)}</div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('confidence')}</div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-full max-w-[80px] h-2 rounded-full bg-surface2 overflow-hidden">
                                        <div className="h-full rounded-full" style={{
                                          width: `${company.confidence ?? 0}%`,
                                          background: (company.confidence ?? 0) >= 70
                                            ? 'var(--color-green)'
                                            : (company.confidence ?? 0) >= 40
                                              ? 'var(--color-yellow)'
                                              : 'var(--color-muted)',
                                        }} />
                                      </div>
                                      <span className="text-sm font-bold">{company.confidence ?? '—'}</span>
                                    </div>
                                    {company.fitType && (
                                      <div className="text-xs text-muted mt-1">
                                        {getFitTypeLabel(company.fitType)}
                                      </div>
                                    )}
                                  </div>
                                </div>

                            {company.permits && company.permits.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('permits')}</div>
                                <div className="flex flex-wrap gap-2">
                                  {company.permits.map((p, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                                      style={{
                                        background: p.status === 'Active'
                                          ? 'color-mix(in srgb, var(--color-green) 10%, transparent)'
                                          : 'color-mix(in srgb, var(--color-red) 10%, transparent)',
                                        color: p.status === 'Active' ? 'var(--color-green)' : 'var(--color-red)',
                                        border: '1px solid var(--color-border)',
                                      }}
                                    >
                                      {p.agency} · {p.permitType} · {p.permitNumber}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {company.scrapedLicenseNumbers && company.scrapedLicenseNumbers.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('licenses')}</div>
                                <div className="flex flex-wrap gap-2">
                                  {company.scrapedLicenseNumbers.map((lic, i) => (
                                    <span key={i}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                                      style={{
                                        background: 'color-mix(in srgb, #8b5cf6 10%, transparent)',
                                        color: '#8b5cf6',
                                        border: '1px solid var(--color-border)',
                                      }}>
                                      {lic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {((company.extractedServices && company.extractedServices.length > 0) ||
                              (company.extractedEquipment && company.extractedEquipment.length > 0)) && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('detected services & equipment')}</div>
                                <div className="flex flex-wrap gap-2">
                                  {company.extractedServices?.map((s, i) => (
                                    <span key={`s-${i}`}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                                      style={{
                                        background: 'color-mix(in srgb, #3b82f6 10%, transparent)',
                                        color: '#3b82f6',
                                        border: '1px solid var(--color-border)',
                                      }}>
                                      {s.id}
                                    </span>
                                  ))}
                                  {company.extractedEquipment?.map((e, i) => (
                                    <span key={`e-${i}`}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                                      style={{
                                        background: 'color-mix(in srgb, #10b981 10%, transparent)',
                                        color: '#10b981',
                                        border: '1px solid var(--color-border)',
                                      }}>
                                      {e.id}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {company.matchedSignals && company.matchedSignals.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('matched keywords')}</div>
                                <div className="flex flex-wrap gap-2">
                                  {company.matchedSignals.map((s, i) => (
                                    <span key={i}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                                      style={{
                                        background: 'color-mix(in srgb, var(--color-green) 10%, transparent)',
                                        color: 'var(--color-green)',
                                        border: '1px solid var(--color-border)',
                                      }}>
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {company.scrapedKeywords && company.scrapedKeywords.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('scraped keywords')}</div>
                                <div className="flex flex-wrap gap-2">
                                  {company.scrapedKeywords.map((kw, i) => (
                                    <span key={i}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                                      style={{
                                        background: 'color-mix(in srgb, var(--color-yellow) 10%, transparent)',
                                        color: 'var(--color-yellow)',
                                        border: '1px solid var(--color-border)',
                                      }}>
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {company.capabilitySummary && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('signals')}</div>
                                <p className="text-sm text-muted leading-relaxed">{company.capabilitySummary}</p>
                              </div>
                            )}
                            {company.aiSummary && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('ai summary')}</div>
                                <p className="text-sm text-muted leading-relaxed italic">{company.aiSummary}</p>
                              </div>
                            )}
                            {company.distanceMiles != null && (() => {
                              const vol = Math.max(projectVolume || 3000, 0);
                              const config = getVerticalEstimatorConfig(vertical || '');
                              const single = calculateHaulingCost(company.distanceMiles, config);
                              const trips = Math.ceil(vol / config.truckCapacityGallons) || 1;
                              const totalHauling = single.estimatedHaulingCost * trips;
                              const totalDisposal = Math.round(vol * config.disposalFeePerGallon);
                              const total = totalHauling + totalDisposal;
                              const perGal = vol > 0 ? parseFloat((total / vol).toFixed(3)) : 0;
                              const totalMins = single.cycleTimeMinutes * trips;

                              return (
                                <div className="space-y-2">
                                  <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('hauling & disposal estimate')}</div>
                                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted">{t('trips required')}</span>
                                      <span className="font-medium tabular-nums">{trips} haul{trips > 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted">{t('total cycle')}</span>
                                      <span className="font-medium tabular-nums">{totalMins} min</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted">{t('hauling cost')}</span>
                                      <span className="font-medium tabular-nums">${totalHauling.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted">{t('disposal fee')}</span>
                                      <span className="font-medium tabular-nums">${totalDisposal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between col-span-2 border-t pt-1.5 mt-1" style={{ borderColor: 'var(--color-border)' }}>
                                      <span className="font-semibold">{t('total estimated cost')}</span>
                                      <span className="font-semibold tabular-nums">${total.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between col-span-2 text-[11px]">
                                      <span className="text-muted">{t('cost per gallon')}</span>
                                      <span className="font-medium tabular-nums">${perGal.toFixed(3)}/gal · {config.truckCapacityGallons.toLocaleString()} gal cap</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
