'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import MetricsRow from './MetricsRow';
import SearchConsole from './SearchConsole';
import ResultsView from './ResultsView';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';

interface SearchPane {
  data: { companies: SearchResult[]; count: number } | null;
  loading: boolean;
  error: string | null;
  vertical: string;
}

function emptyPane(): SearchPane {
  return { data: null, loading: false, error: null, vertical: '' };
}

export default function DashboardShell() {
  const { t, language } = useLanguage();
  const [left, setLeft] = useState<SearchPane>(emptyPane);
  const [right, setRight] = useState<SearchPane>(emptyPane);

  const handleFeedback = useCallback(async (company: SearchResult, voteType: VoteType, vertical: string) => {
    if (!vertical) return;
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: company.id,
        companyName: company.companyName,
        vertical,
        voteType,
        leadScore: company.leadScore,
        signals: company.capabilitySummary,
      }),
    }).catch(() => {});
  }, []);

  function makeHandler(side: 'left' | 'right') {
    const setPane = side === 'left' ? setLeft : setRight;

    return {
      handleResults: useCallback(async (data: { companies: SearchResult[]; count: number; providerFailures?: string[] }) => {
        let companies = data.companies.filter(c => c.grade !== 'D');

        if (language === 'es' && companies.length > 0) {
          const summaries = companies.map(c => c.capabilitySummary || '');
          try {
            const res = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: summaries, target: 'es' }),
            });
            const td = await res.json();
            if (td.success && Array.isArray(td.translatedText)) {
              companies = companies.map((c, i) => ({
                ...c,
                capabilitySummary: td.translatedText[i] || c.capabilitySummary,
              }));
            }
          } catch {}
        }

        setPane(p => ({ ...p, data: { companies, count: companies.length }, loading: false }));
      }, [language]),

      handleError: useCallback((error: string) => {
        setPane(p => ({ ...p, error, data: null, loading: false }));
      }, []),

      handleSearchStart: useCallback(() => {
        setPane(p => ({ ...p, loading: true, error: null }));
      }, []),

      setVertical: useCallback((v: string) => {
        setPane(p => ({ ...p, vertical: v }));
      }, []),
    };
  }

  const lh = makeHandler('left');
  const rh = makeHandler('right');

  return (
    <div className="space-y-6 md:space-y-8">
      <MetricsRow />

      {/* Two search tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SearchConsole
          onResults={lh.handleResults}
          onError={lh.handleError}
          onSearchStart={lh.handleSearchStart}
          vertical={left.vertical}
          onVerticalChange={lh.setVertical}
        />
        <SearchConsole
          onResults={rh.handleResults}
          onError={rh.handleError}
          onSearchStart={rh.handleSearchStart}
          vertical={right.vertical}
          onVerticalChange={rh.setVertical}
        />
      </div>

      {/* Grading legend */}
      <div
        className="rounded-xl p-4 flex items-center gap-4 flex-wrap"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
          {t('grading:')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
          <span className="font-bold" style={{ color: 'var(--color-green)' }}>A</span>
          = {t('good to go')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
          <span className="font-bold" style={{ color: 'var(--color-yellow)' }}>B</span>
          = {t('check website or call to verify')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
          <span className="font-bold" style={{ color: 'var(--color-red)' }}>C</span>
          = {t('call to verify')}
        </span>
      </div>

      {/* Two results */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ResultsView
          results={left.data?.companies ?? null}
          loading={left.loading}
          error={left.error !== null}
          vertical={left.vertical}
          onFeedback={(c, v) => handleFeedback(c, v, left.vertical)}
        />
        <ResultsView
          results={right.data?.companies ?? null}
          loading={right.loading}
          error={right.error !== null}
          vertical={right.vertical}
          onFeedback={(c, v) => handleFeedback(c, v, right.vertical)}
        />
      </div>
    </div>
  );
}
