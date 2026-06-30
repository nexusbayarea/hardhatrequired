'use client';

import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, Phone, ExternalLink, Loader2, Search, MapPin, Globe, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Badge from '@/components/ui/Badge';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';

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
  onFeedback?: (company: SearchResult, voteType: VoteType) => void;
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

function formatDistance(d: number | null): string {
  if (d == null) return '—';
  return `${d.toFixed(1)} mi`;
}

export default function ResultsTable({ companies, contacts: allContacts, loading, onFeedback }: ResultsTableProps) {
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
              {[t('company'), t('grade'), t('distance'), t('score'), t('signals'), t('accurate?'), ''].map((h) => (
                <th key={h} className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => {
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
                    <td className="px-4 py-3 text-sm text-muted max-w-[200px] truncate">
                      {company.capabilitySummary || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {currentVote ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider"
                          style={{
                            background: currentVote === 'accurate'
                              ? 'color-mix(in srgb, var(--color-green) 12%, transparent)'
                              : currentVote === 'partial'
                              ? 'color-mix(in srgb, var(--color-yellow) 12%, transparent)'
                              : 'color-mix(in srgb, var(--color-red) 12%, transparent)',
                            color: currentVote === 'accurate'
                              ? 'var(--color-green)'
                              : currentVote === 'partial'
                              ? 'var(--color-yellow)'
                              : 'var(--color-red)',
                          }}
                        >
                          {currentVote === 'accurate' ? <ThumbsUp className="w-3 h-3" /> : currentVote === 'partial' ? <Minus className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                          {currentVote === 'accurate' ? t('accurate') : currentVote === 'partial' ? t('partial') : t('bad')}
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
                            onClick={(e) => { e.stopPropagation(); handleVote(company, 'partial'); }}
                            className="p-1.5 rounded-lg text-xs transition-all hover:scale-105 hover:bg-yellow/10 hover:text-yellow text-muted"
                          >
                            <Minus className="w-3.5 h-3.5" />
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
                          href={company.website ? `https://${company.website.replace(/^https?:\/\//, '').replace(/^https?\//, '').replace(/^\//, '')}` : '#'}
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
                                    <MapPin className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                                    <span className="text-muted">{company.address}</span>
                                  </div>
                                )}
                                {company.phone && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                                    <a href={`tel:${company.phone}`} className="text-blue hover:underline">{company.phone}</a>
                                  </div>
                                )}
                                {company.website && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Globe className="w-3.5 h-3.5 text-muted shrink-0" />
                                    <a href={`https://${company.website.replace(/^https?:\/\//, '').replace(/^https?\//, '').replace(/^\//, '')}`} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline truncate">{company.website}</a>
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
                            </div>

                            {company.capabilitySummary && (
                              <div className="space-y-2">
                                <div className="text-[10px] font-semibold text-muted uppercase tracking-wider">{t('signals')}</div>
                                <p className="text-sm text-muted leading-relaxed">{company.capabilitySummary}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
