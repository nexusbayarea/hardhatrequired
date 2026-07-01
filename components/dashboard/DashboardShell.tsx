'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import MetricsRow from './MetricsRow';
import SearchConsole from './SearchConsole';
import ResultsView from './ResultsView';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';

export default function DashboardShell() {
  const { t, language } = useLanguage();
  const [searchData, setSearchData] = useState<{ companies: SearchResult[]; count: number } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeVertical, setActiveVertical] = useState('');

  const handleResults = useCallback(async (data: { companies: SearchResult[]; count: number; providerFailures?: string[] }) => {
    setSearchError(null);
    let companies = data.companies.filter(c => c.grade !== 'D');

    if (language === 'es' && companies.length > 0) {
      const summaries = companies.map(c => c.capabilitySummary || '');

      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: summaries, target: 'es' }),
        });
        const data = await res.json();

        if (data.success && Array.isArray(data.translatedText)) {
          companies = companies.map((c, i) => ({
            ...c,
            capabilitySummary: data.translatedText[i] || c.capabilitySummary,
          }));
        }
      } catch {}
    }

    setSearchData({ companies, count: companies.length });
    setSearchLoading(false);
  }, [language]);

  const handleError = useCallback((error: string) => {
    setSearchError(error);
    setSearchData(null);
    setSearchLoading(false);
  }, []);

  const handleSearchStart = useCallback(() => {
    setSearchLoading(true);
    setSearchError(null);
  }, []);

  const handleFeedback = useCallback(async (company: SearchResult, voteType: VoteType) => {
    if (!activeVertical) return;
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: company.id,
        companyName: company.companyName,
        vertical: activeVertical,
        voteType,
        leadScore: company.leadScore,
        signals: company.capabilitySummary,
      }),
    }).catch(() => {});
  }, [activeVertical]);

  return (
    <div className="space-y-6 md:space-y-8">
      <MetricsRow />

      <SearchConsole
        onResults={handleResults}
        onError={handleError}
        onSearchStart={handleSearchStart}
        vertical={activeVertical}
        onVerticalChange={setActiveVertical}
      />

      <div>
        <div className="flex items-baseline justify-between mb-5">
          <h2
            className="font-black uppercase tracking-wider"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1.375rem',
              letterSpacing: '0.06em',
              color: 'var(--color-red)',
            }}
          >
            {t('results')}
          </h2>
          <div
            className="text-sm font-semibold"
            style={{ color: 'var(--color-muted)' }}
          >
            {searchLoading
              ? t('searching...')
              : searchError
              ? t('search failed')
              : searchData
              ? `${searchData.count} ${t('companies found')}`
              : t('run a search above')}
          </div>
        </div>
        {searchError && (
          <div
            className="mb-5 p-4 rounded-xl text-base font-semibold flex items-center gap-3"
            style={{
              background: 'color-mix(in srgb, var(--color-red) 10%, var(--color-surface2))',
              border: '1px solid color-mix(in srgb, var(--color-red) 30%, transparent)',
              color: 'var(--color-red)',
            }}
          >
            ⚠ {searchError}
          </div>
        )}
        <ResultsView
          results={searchData?.companies ?? null}
          loading={searchLoading}
          error={searchError !== null}
          vertical={activeVertical}
          onFeedback={handleFeedback}
        />
      </div>
    </div>
  );
}
