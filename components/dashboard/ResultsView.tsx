'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Phone, Globe, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import ResultsTable from './ResultsTable';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';

interface ResultsViewProps {
  results: SearchResult[] | null;
  loading: boolean;
  vertical?: string;
  onFeedback?: (company: SearchResult, voteType: VoteType) => void;
}

/* ── Mobile card view — optimised for glove use ── */
function ResultsCards({ results, onFeedback }: { results: SearchResult[]; onFeedback?: (company: SearchResult, voteType: VoteType) => void }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [voted, setVoted] = useState<Record<string, VoteType>>({});

  const handleVote = (r: SearchResult, voteType: VoteType) => {
    setVoted((prev) => ({ ...prev, [r.id]: voteType }));
    onFeedback?.(r, voteType);
  };

  return (
    <div className="space-y-3">
      {results.map((r) => {
        const isExpanded = expanded === r.id;
        const gradeColor =
          r.grade === 'A' ? 'var(--color-green)' :
          r.grade === 'B' ? 'var(--color-yellow)' :
          'var(--color-muted)';

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
                  {r.distanceMiles != null && (
                    <div
                      className="text-sm font-medium mt-1"
                      style={{ color: 'var(--color-muted)' }}
                    >
                      {r.distanceMiles.toFixed(1)} {t('mi away')}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className="font-black leading-none"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '2rem',
                      color: gradeColor,
                    }}
                  >
                    {r.grade}
                  </div>
                  <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {r.leadScore}
                  </div>
                </div>
              </div>

              {/* Action buttons — 56px height for gloves */}
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
                    background: 'var(--color-red)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  {t('details')}
                </button>
              </div>

              {/* Mobile feedback buttons */}
              <div className="flex gap-3 mt-3">
                {(['accurate', 'partial', 'bad'] as const).map((v) => {
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
                            : v === 'partial'
                            ? 'color-mix(in srgb, var(--color-yellow) 12%, transparent)'
                            : 'color-mix(in srgb, var(--color-red) 12%, transparent)'
                          : 'var(--color-surface2)',
                        color: isVoted
                          ? v === 'accurate'
                            ? 'var(--color-green)'
                            : v === 'partial'
                            ? 'var(--color-yellow)'
                            : 'var(--color-red)'
                          : 'var(--color-muted)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {v === 'accurate' ? t('accurate') : v === 'partial' ? t('partial') : t('bad')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expanded detail panel */}
            {isExpanded && (
              <div
                className="px-5 pb-5 pt-4 space-y-4 border-t"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
              >
                {r.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--color-muted)' }} />
                    <span className="text-base" style={{ color: 'var(--color-muted)' }}>{r.address}</span>
                  </div>
                )}
                {r.phone && (
                  <a
                    href={`tel:${r.phone}`}
                    className="flex items-center gap-3 text-base"
                    style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                  >
                    <Phone className="w-5 h-5 flex-shrink-0" />
                    {r.phone}
                  </a>
                )}
                {r.website && (
                  <a
                    href={`https://${r.website.replace(/^https?:\/\//, '').replace(/^https?\//, '').replace(/^\//, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-base"
                    style={{ color: 'var(--color-blue)', textDecoration: 'none' }}
                  >
                    <Globe className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{r.website}</span>
                  </a>
                )}
                {r.capabilitySummary && (
                  <div>
                      <div
                        className="text-xs font-black uppercase tracking-widest mb-2"
                        style={{ color: 'var(--color-muted)' }}
                      >
                        {t('signals')}
                      </div>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                      {r.capabilitySummary}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main export: table on desktop, cards on mobile ── */
export default function ResultsView({ results, loading, vertical, onFeedback }: ResultsViewProps) {
  const { t } = useLanguage();
  /* Empty / loading states */
  const EmptyState = ({ msg }: { msg: string }) => (
    <div
      className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <Search className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
      <div
        className="font-bold mb-2"
        style={{ fontSize: '1.125rem', color: 'var(--color-text)' }}
      >
        {t('no results yet')}
      </div>
      <div className="text-base" style={{ color: 'var(--color-muted)' }}>{msg}</div>
    </div>
  );

  const LoadingCards = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl p-5 animate-pulse"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="h-5 rounded w-2/3 mb-2"
            style={{ background: 'var(--color-surface2)' }}
          />
          <div
            className="h-4 rounded w-1/4 mb-4"
            style={{ background: 'var(--color-surface2)' }}
          />
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
      {/* Desktop: table */}
      <div className="hidden lg:block">
        <ResultsTable companies={results ?? undefined} loading={loading} vertical={vertical} onFeedback={onFeedback} />
      </div>

      {/* Mobile / tablet: cards */}
      <div className="block lg:hidden">
        {loading ? (
          <LoadingCards />
        ) : !results || results.length === 0 ? (
          <EmptyState msg={t('set your parameters above and run a discovery search')} />
        ) : (
          <ResultsCards results={results} onFeedback={onFeedback} />
        )}
      </div>
    </>
  );
}
