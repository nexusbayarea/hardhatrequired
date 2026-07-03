'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Phone, Globe, MapPin, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ResultsTable from './ResultsTable';
import { groupResults, FIT_COLORS, FIT_ICONS, getFitTypeLabel } from '@/lib/results/groups';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';
import type { SearchPane } from './SearchConsole';

interface ResultsViewProps {
  results: SearchResult[] | null;
  loading: boolean;
  error?: boolean;
  vertical?: string;
  onFeedback?: (company: SearchResult, voteType: VoteType) => void;
  activePane: SearchPane;
}

/* ── Mobile card view ── */
function ResultsCards({ results, onFeedback, activePane }: { results: SearchResult[]; onFeedback?: (company: SearchResult, voteType: VoteType) => void; activePane: SearchPane }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [voted, setVoted] = useState<Record<string, VoteType>>({});

  const handleVote = (r: SearchResult, voteType: VoteType) => {
    setVoted((prev) => ({ ...prev, [r.id]: voteType }));
    onFeedback?.(r, voteType);
  };

  const groups = groupResults(results, activePane);
  const isDisposal = activePane === 'disposal';

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.fitType}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-lg">{FIT_ICONS[group.fitType] ?? '📌'}</span>
            <h3
              className="font-bold uppercase tracking-wider"
              style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}
            >
              {group.label}
            </h3>
            <span
              className="text-xs font-medium ml-1 px-1.5 py-0.5 rounded"
              style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}
            >
              {group.results.length}
            </span>
          </div>

          <div className="space-y-3">
            {group.results.map((r) => {
              const isExpanded = expanded === r.id;
              const fitColor = (r.fitType ? FIT_COLORS[r.fitType] : undefined) ?? { bg: 'var(--color-surface2)', text: 'var(--color-muted)' };

              return (
                <div
                  key={r.id}
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                  <div className="p-5">
                    {/* Company name + grade row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-3">
                        <div
                          className="font-bold leading-tight truncate"
                          style={{ fontSize: '1.125rem', color: 'var(--color-text)' }}
                        >
                          {r.companyName}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {r.fitType && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                              style={{ background: fitColor.bg, color: fitColor.text }}
                            >
                              {FIT_ICONS[r.fitType]} {getFitTypeLabel(r.fitType)}
                            </span>
                          )}
                          {r.confidence != null && (
                            <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                              {r.confidence}% confidence
                            </span>
                          )}
                        </div>
                        {!isDisposal && r.distanceMiles != null && (
                          <div className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
                            {r.distanceMiles.toFixed(1)} {t('mi away')}
                          </div>
                        )}
                        {isDisposal && r.permits && r.permits.length > 0 && (
                          <div className="mt-1">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                              style={{
                                background: r.permits.some(p => p.status === 'Active')
                                  ? 'color-mix(in srgb, var(--color-green) 12%, transparent)'
                                  : 'color-mix(in srgb, var(--color-red) 12%, transparent)',
                                color: r.permits.some(p => p.status === 'Active') ? 'var(--color-green)' : 'var(--color-red)',
                              }}
                            >
                              {r.permits.some(p => p.status === 'Active') ? 'ACTIVE PERMIT' : 'PERMIT'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className="font-black leading-none"
                          style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: '2rem',
                            color: r.grade === 'A' ? 'var(--color-green)' : r.grade === 'B' ? 'var(--color-yellow)' : 'var(--color-muted)',
                          }}
                        >
                          {r.grade}
                        </div>
                        <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--color-muted)' }}>
                          {r.leadScore}
                        </div>
                      </div>
                    </div>

                    {/* Signals / waste accepted */}
                    {r.capabilitySummary && (
                      <div className="mb-3 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                        {r.capabilitySummary}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <a
                        href={r.phone ? `tel:${r.phone}` : '#'}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-base transition-all"
                        style={{
                          height: '56px',
                          background: 'var(--color-surface2)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                          textDecoration: 'none',
                          opacity: r.phone ? 1 : 0.4,
                          pointerEvents: r.phone ? 'auto' : 'none',
                        }}
                      >
                        <Phone className="w-5 h-5" />
                        {t('call')}
                      </a>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : r.id)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-base text-white transition-all"
                        style={{
                          height: '56px',
                          background: isDisposal ? 'var(--color-green)' : 'var(--color-red)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        {t('details')}
                      </button>
                    </div>

                    {/* Mobile feedback */}
                    <div className="flex gap-3 mt-3">
                      {(['accurate', 'bad'] as const).map((v) => {
                        const isVoted = voted[r.id] === v;
                        return (
                          <button
                            key={v}
                            onClick={() => handleVote(r, v)}
                            style={{
                              flex: 1,
                              height: '48px',
                              borderRadius: '10px',
                              border: '1px solid var(--color-border)',
                              background: isVoted
                                ? v === 'accurate'
                                  ? 'color-mix(in srgb, var(--color-green) 12%, transparent)'
                                  : 'color-mix(in srgb, var(--color-red) 12%, transparent)'
                                : 'var(--color-surface2)',
                              color: isVoted
                                ? v === 'accurate' ? 'var(--color-green)' : 'var(--color-red)'
                                : 'var(--color-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            {v === 'accurate' ? <ThumbsUp className="w-5 h-5" /> : <ThumbsDown className="w-5 h-5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div
                      className="px-5 pb-5 pt-4 space-y-4 border-t"
                      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
                    >
                      {r.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-blue)' }} />
                          <a
                            href={r.coordinates
                              ? `https://www.google.com/maps/search/?api=1&query=${r.coordinates.lat},${r.coordinates.lng}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base hover:underline"
                            style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                          >
                            {r.address}
                          </a>
                        </div>
                      )}
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="flex items-center gap-3 text-base" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
                          <Phone className="w-5 h-5 flex-shrink-0" />
                          {r.phone}
                        </a>
                      )}
                      {r.website && (
                        <a
                          href={`https://${r.website.replace(/^https?:\/\//, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 text-base" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                        >
                          <Globe className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{r.website}</span>
                        </a>
                      )}
                      {r.email && (
                        <a href={`mailto:${r.email}`} className="flex items-center gap-3 text-base" style={{ color: 'var(--color-blue)', textDecoration: 'none' }}>
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          <span className="truncate">{r.email}</span>
                        </a>
                      )}
                      {r.source && (
                        <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: 'color-mix(in srgb, var(--color-muted) 10%, transparent)', color: 'var(--color-muted)' }}>
                            {r.source}
                          </span>
                          {r.googleRating != null && (
                            <span style={{ color: 'var(--color-yellow)' }}>★ {r.googleRating.toFixed(1)} {r.googleReviewCount != null ? `(${r.googleReviewCount})` : ''}</span>
                          )}
                        </div>
                      )}
                      {r.relevanceReason && (
                        <div className="text-sm" style={{ color: 'var(--color-muted)' }}>{r.relevanceReason}</div>
                      )}
                      {r.distanceMiles != null && (
                        <div className="flex items-center gap-3 text-base" style={{ color: 'var(--color-muted)' }}>
                          <MapPin className="w-5 h-5 flex-shrink-0" />
                          <span>{r.distanceMiles.toFixed(1)} mi</span>
                        </div>
                      )}
                      {r.confidence != null && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black uppercase tracking-widest shrink-0" style={{ color: 'var(--color-muted)' }}>{t('confidence')}</span>
                          <div className="flex-1 max-w-[120px] h-2 rounded-full bg-surface2 overflow-hidden">
                            <div className="h-full rounded-full" style={{
                              width: `${r.confidence}%`,
                              background: r.confidence >= 70 ? 'var(--color-green)' : r.confidence >= 40 ? 'var(--color-yellow)' : 'var(--color-muted)',
                            }} />
                          </div>
                          <span className="text-sm font-bold">{r.confidence}%</span>
                        </div>
                      )}
                      {r.permits && r.permits.length > 0 && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>{t('permits')}</div>
                          <div className="flex flex-wrap gap-2">
                            {r.permits.map((p, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                                style={{
                                  background: p.status === 'Active' ? 'color-mix(in srgb, var(--color-green) 10%, transparent)' : 'color-mix(in srgb, var(--color-red) 10%, transparent)',
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
                      {r.scrapedLicenseNumbers && r.scrapedLicenseNumbers.length > 0 && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>{t('licenses')}</div>
                          <div className="flex flex-wrap gap-2">
                            {r.scrapedLicenseNumbers.map((lic, i) => (
                              <span key={i}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
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
                      {((r.extractedServices && r.extractedServices.length > 0) ||
                        (r.extractedEquipment && r.extractedEquipment.length > 0)) && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>{t('detected services & equipment')}</div>
                          <div className="flex flex-wrap gap-2">
                            {r.extractedServices?.map((s, i) => (
                              <span key={`s-${i}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                                style={{
                                  background: 'color-mix(in srgb, #3b82f6 10%, transparent)',
                                  color: '#3b82f6',
                                  border: '1px solid var(--color-border)',
                                }}>
                                {s.id}
                              </span>
                            ))}
                            {r.extractedEquipment?.map((e, i) => (
                              <span key={`e-${i}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
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
                      {r.matchedSignals && r.matchedSignals.length > 0 && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>{t('matched keywords')}</div>
                          <div className="flex flex-wrap gap-2">
                            {r.matchedSignals.map((s, i) => (
                              <span key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium"
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
                      {r.capabilitySummary && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: 'var(--color-muted)' }}>{t('signals')}</div>
                          <p className="text-base leading-relaxed" style={{ color: 'var(--color-muted)' }}>{r.capabilitySummary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className="h-32 md:hidden" />
    </div>
  );
}

/* ── Main export ── */
export default function ResultsView({ results, loading, error, vertical, onFeedback, activePane }: ResultsViewProps) {
  const { t } = useLanguage();

  const EmptyState = ({ msg }: { msg: string }) => (
    <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
      <Search className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
      <div className="font-bold mb-2" style={{ fontSize: '1.125rem', color: 'var(--color-text)' }}>{t('no results yet')}</div>
      <div className="text-base" style={{ color: 'var(--color-muted)' }}>{msg}</div>
    </div>
  );

  const LoadingCards = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="h-5 rounded w-2/3 mb-2" style={{ background: 'var(--color-surface2)' }} />
          <div className="h-4 rounded w-1/4 mb-4" style={{ background: 'var(--color-surface2)' }} />
          <div className="flex gap-3">
            <div className="flex-1 h-14 rounded-xl" style={{ background: 'var(--color-surface2)' }} />
            <div className="flex-1 h-14 rounded-xl" style={{ background: 'var(--color-surface2)' }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="hidden lg:block">
        <ResultsTable companies={results ?? undefined} loading={loading} vertical={vertical} onFeedback={onFeedback} activePane={activePane} />
      </div>
      <div className="block lg:hidden">
        {loading ? (
          <LoadingCards />
        ) : error ? (
          <EmptyState msg={t('search failed — try again or contact support')} />
        ) : !results || results.length === 0 ? (
          <EmptyState msg={t('set your parameters above and run a discovery search')} />
        ) : (
          <ResultsCards results={results} onFeedback={onFeedback} activePane={activePane} />
        )}
      </div>
    </>
  );
}
