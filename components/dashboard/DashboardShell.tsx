'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import MetricsRow from './MetricsRow';
import SearchConsole from './SearchConsole';
import ResultsView from './ResultsView';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';

export default function DashboardShell() {
  const { t } = useLanguage();
  const [searchData, setSearchData] = useState<{ companies: SearchResult[]; count: number } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeVertical, setActiveVertical] = useState('');

  const handleResults = useCallback((data: { companies: SearchResult[]; count: number }) => {
    const filtered = data.companies.filter(c => c.grade !== 'D');
    setSearchData({ companies: filtered, count: filtered.length });
    setSearchLoading(false);
  }, []);

  const handleSearchStart = useCallback(() => {
    setSearchLoading(true);
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
              : searchData
              ? `${searchData.count} ${t('companies found')}`
              : t('run a search above')}
          </div>
        </div>
        <ResultsView
          results={searchData?.companies ?? null}
          loading={searchLoading}
          vertical={activeVertical}
          onFeedback={handleFeedback}
        />
      </div>
    </div>
  );
}
