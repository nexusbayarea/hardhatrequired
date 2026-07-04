'use client';

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Phone, Globe, MapPin, ThumbsUp, ThumbsDown, Columns, Share2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ResultsTable from './ResultsTable';
import VendorComparison from './VendorComparison';
import ResultsGraph from './ResultsGraph';
import { groupResults, FIT_COLORS, FIT_ICONS, getFitTypeLabel } from '@/lib/results/groups';
import { getVerticalEstimatorConfig } from '@/lib/logistics/normalizer';
import { calculateHaulingCost } from '@/lib/logistics/cost-estimator';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';
import type { SearchPane } from './SearchConsole';

interface ResultsViewProps {
  results: SearchResult[] | null;
  loading: boolean;
  error?: boolean;
  vertical?: string;
  projectVolume?: number;
  onVolumeChange?: (v: number) => void;
  onFeedback?: (company: SearchResult, voteType: VoteType) => void;
  activePane: SearchPane;
}

/* ── Mobile card view ── */
function ResultsCards({ results, onFeedback, activePane, projectVolume, vertical }: {
  results: SearchResult[];
  onFeedback?: (company: SearchResult, voteType: VoteType) => void;
  activePane: SearchPane;
  projectVolume?: number;
  vertical?: string;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [voted, setVoted] = useState<Record<string, VoteType>>({});

  const handleVote = (r: SearchResult, voteType: VoteType) => {
    setVoted((prev) => ({ ...prev, [r.id]: voteType }));
    onFeedback?.(r, voteType);
  };

  const groups = groupResults(results, activePane === 'labor' || activePane === 'disposal' ? activePane : undefined);
  const isDisposal = activePane === 'disposal';

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.fitType}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-lg">{FIT_ICONS[group.fitType] ?? '📌'}</span>
            <h3 className="font-bold uppercase tracking-wider text-xs text-muted">
              {group.label}
            </h3>
            <span className="text-xs font-medium ml-1 px-1.5 py-0.5 rounded bg-surface2 text-muted">
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
                  className="rounded-xl overflow-hidden surface-card"
                >
                  <div className="p-5">
                    {/* Company name + grade row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0 pr-3">
                        <div className="font-bold leading-tight truncate text-lg text-text">
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
                            <span className="text-xs font-medium text-muted">
                              {r.confidence}% confidence
                            </span>
                          )}
                        </div>
                        {!isDisposal && r.distanceMiles != null && (
                          <div className="text-sm font-medium mt-1 text-muted">
                            {r.distanceMiles.toFixed(1)} {t('mi away')}
                          </div>
                        )}
                        {isDisposal && r.permits && r.permits.length > 0 && (
                          <div className="mt-1">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                r.permits.some(p => p.status === 'Active') ? 'tag-green-active' : 'tag-red-active'
                              }`}
                            >
                              {r.permits.some(p => p.status === 'Active') ? 'ACTIVE PERMIT' : 'PERMIT'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className="font-display font-black leading-none text-3xl"
                          style={{
                            color: r.grade === 'A' ? 'var(--color-green)' : r.grade === 'B' ? 'var(--color-yellow)' : 'var(--color-muted)',
                          }}
                        >
                          {r.grade}
                        </div>
                        <div className="text-sm font-bold mt-0.5 text-muted">
                          {r.leadScore}
                        </div>
                      </div>
                    </div>

                    {/* Signals / waste accepted */}
                    {r.capabilitySummary && (
                      <div className="mb-3 text-sm leading-relaxed text-muted">
                        {r.capabilitySummary}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <a
                        href={r.phone ? `tel:${r.phone}` : '#'}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-base transition-all bg-surface2 border border-border text-text no-underline h-14 ${r.phone ? '' : 'opacity-40 pointer-events-none'}`}
                      >
                        <Phone className="w-5 h-5" />
                        {t('call')}
                      </a>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : r.id)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-xl font-bold text-base text-white transition-all h-14 border-none cursor-pointer ${isDisposal ? 'bg-green' : 'bg-red'}`}
                      >
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        {t('details')}
                      </button>
                    </div>

                    {/* Mobile feedback */}
                    <div className="flex gap-3 mt-3">
                      {(['accurate', 'bad'] as const).map((v) => {
                        const isVoted = voted[r.id] === v;
                        const voteClass = isVoted
                          ? v === 'accurate' ? 'tag-green-active border border-border' : 'tag-red-active border border-border'
                          : 'bg-surface2 text-muted border border-border';
                        return (
                          <button
                            key={v}
                            onClick={() => handleVote(r, v)}
                            className={`flex-1 h-12 rounded-xl flex items-center justify-center cursor-pointer ${voteClass}`}
                          >
                            {v === 'accurate' ? <ThumbsUp className="w-5 h-5" /> : <ThumbsDown className="w-5 h-5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-4 space-y-4 border-t surface-divider bg-surface2">
                      {r.address && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue" />
                          <a
                            href={r.coordinates
                              ? `https://www.google.com/maps/search/?api=1&query=${r.coordinates.lat},${r.coordinates.lng}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-base hover:underline text-blue no-underline"
                          >
                            {r.address}
                          </a>
                        </div>
                      )}
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="flex items-center gap-3 text-base text-blue no-underline">
                          <Phone className="w-5 h-5 flex-shrink-0" />
                          {r.phone}
                        </a>
                      )}
                      {r.website && (
                        <a
                          href={`https://${r.website.replace(/^https?:\/\//, '')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-3 text-base text-blue no-underline"
                        >
                          <Globe className="w-5 h-5 flex-shrink-0" />
                          <span className="truncate">{r.website}</span>
                        </a>
                      )}
                      {r.email && (
                        <a href={`mailto:${r.email}`} className="flex items-center gap-3 text-base text-blue no-underline">
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                          <span className="truncate">{r.email}</span>
                        </a>
                      )}
                      {r.googleRating != null && (
                        <div className="flex items-center gap-3 text-sm text-muted">
                          <span className="text-yellow">★ {r.googleRating.toFixed(1)} {r.googleReviewCount != null ? `(${r.googleReviewCount})` : ''}</span>
                        </div>
                      )}
                      {r.relevanceReason && (
                        <div className="text-sm text-muted">{r.relevanceReason}</div>
                      )}
                      {r.distanceMiles != null && (
                        <div className="flex items-center gap-3 text-base text-muted">
                          <MapPin className="w-5 h-5 flex-shrink-0" />
                          <span>{r.distanceMiles.toFixed(1)} mi</span>
                        </div>
                      )}
                      {r.confidence != null && (
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black uppercase tracking-widest shrink-0 text-muted">{t('confidence')}</span>
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
                          <div className="text-xs font-black uppercase tracking-widest mb-2 text-muted">{t('permits')}</div>
                          <div className="flex flex-wrap gap-2">
                            {r.permits.map((p, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-border ${p.status === 'Active' ? 'tag-green' : 'tag-red'}`}
                              >
                                {p.agency} · {p.permitType} · {p.permitNumber}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {r.scrapedLicenseNumbers && r.scrapedLicenseNumbers.length > 0 && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2 text-muted">{t('licenses')}</div>
                          <div className="flex flex-wrap gap-2">
                            {r.scrapedLicenseNumbers.map((lic, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium tag-purple">
                                {lic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {((r.extractedServices && r.extractedServices.length > 0) ||
                        (r.extractedEquipment && r.extractedEquipment.length > 0)) && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2 text-muted">{t('detected services & equipment')}</div>
                          <div className="flex flex-wrap gap-2">
                            {r.extractedServices?.map((s, i) => (
                              <span key={`s-${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium tag-blue">
                                {s.id}
                              </span>
                            ))}
                            {r.extractedEquipment?.map((e, i) => (
                              <span key={`e-${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium tag-emerald">
                                {e.id}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {r.matchedSignals && r.matchedSignals.length > 0 && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2 text-muted">{t('matched keywords')}</div>
                          <div className="flex flex-wrap gap-2">
                            {r.matchedSignals.map((s, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium tag-green">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {r.scrapedKeywords && r.scrapedKeywords.length > 0 && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2 text-muted">{t('scraped keywords')}</div>
                          <div className="flex flex-wrap gap-2">
                            {r.scrapedKeywords.map((kw, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium tag-yellow">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {r.capabilitySummary && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2 text-muted">{t('signals')}</div>
                          <p className="text-base leading-relaxed text-muted">{r.capabilitySummary}</p>
                        </div>
                      )}
                      {r.aiSummary && (
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest mb-2 text-muted">{t('ai summary')}</div>
                          <p className="text-base leading-relaxed italic text-muted">{r.aiSummary}</p>
                        </div>
                      )}
                      {r.distanceMiles != null && (() => {
                        const vol = Math.max(projectVolume || 3000, 0);
                        const config = getVerticalEstimatorConfig(vertical || '');
                        const single = calculateHaulingCost(r.distanceMiles, config);
                        const trips = Math.ceil(vol / config.truckCapacityGallons) || 1;
                        const totalHauling = single.estimatedHaulingCost * trips;
                        const totalDisposal = Math.round(vol * config.disposalFeePerGallon);
                        const total = totalHauling + totalDisposal;
                        const perGal = vol > 0 ? parseFloat((total / vol).toFixed(3)) : 0;
                        const totalMins = single.cycleTimeMinutes * trips;

                        return (
                          <div>
                            <div className="text-xs font-black uppercase tracking-widest mb-2 text-muted">{t('hauling & disposal estimate')}</div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
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
                              <div className="flex justify-between col-span-2 border-t surface-divider pt-1.5 mt-1">
                                <span className="font-semibold">{t('total estimated cost')}</span>
                                <span className="font-semibold tabular-nums">${total.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between col-span-2 text-xs">
                                <span className="text-muted">{t('cost per gallon')}</span>
                                <span className="font-medium tabular-nums">${perGal.toFixed(3)}/gal · {config.truckCapacityGallons.toLocaleString()} gal cap</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
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
export default function ResultsView({ results, loading, error, vertical, projectVolume, onVolumeChange, onFeedback, activePane }: ResultsViewProps) {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'grouped' | 'compare' | 'graph'>('grouped');

  const EmptyState = ({ msg }: { msg: string }) => (
    <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center surface-card">
      <Search className="w-10 h-10 mb-4 text-muted" />
      <div className="font-bold mb-2 text-lg text-text">{t('no results yet')}</div>
      <div className="text-base text-muted">{msg}</div>
    </div>
  );

  const LoadingCards = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl p-5 animate-pulse surface-card">
          <div className="h-5 rounded w-2/3 mb-2 bg-surface2" />
          <div className="h-4 rounded w-1/4 mb-4 bg-surface2" />
          <div className="flex gap-3">
            <div className="flex-1 h-14 rounded-xl bg-surface2" />
            <div className="flex-1 h-14 rounded-xl bg-surface2" />
          </div>
        </div>
      ))}
    </div>
  );

  const hasResults = results && results.length > 0;

  return (
    <div data-agent-context="results-panel">
      {/* View mode toggle */}
      {hasResults && !loading && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setViewMode('grouped')}
            className={`view-toggle ${viewMode === 'grouped' ? 'active' : ''}`}
          >
            {t('grouped')}
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={`view-toggle flex items-center gap-1.5 ${viewMode === 'compare' ? 'active' : ''}`}
          >
            <Columns className="w-3 h-3" />
            {t('compare')}
          </button>
          <button
            onClick={() => setViewMode('graph')}
            className={`view-toggle flex items-center gap-1.5 ${viewMode === 'graph' ? 'active' : ''}`}
          >
            <Share2 className="w-3 h-3" />
            {t('graph')}
          </button>
          <span className="text-[11px] font-medium ml-auto text-muted">
            {results!.length} {t('results')}
          </span>
        </div>
      )}

      {viewMode === 'compare' && hasResults ? (
        <VendorComparison companies={results!} onFeedback={onFeedback} />
      ) : viewMode === 'graph' && hasResults ? (
        <ResultsGraph results={results!} activePane={activePane} />
      ) : (
        <>
          <div className="hidden lg:block">
            <ResultsTable companies={results ?? undefined} loading={loading} vertical={vertical} projectVolume={projectVolume} onFeedback={onFeedback} activePane={activePane} />
          </div>
          <div className="block lg:hidden">
            {loading ? (
              <LoadingCards />
            ) : error ? (
              <EmptyState msg={t('search failed — try again or contact support')} />
            ) : !results || results.length === 0 ? (
              <EmptyState msg={t('set your parameters above and run a discovery search')} />
            ) : (
              <ResultsCards results={results} onFeedback={onFeedback} activePane={activePane} projectVolume={projectVolume} vertical={vertical} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
