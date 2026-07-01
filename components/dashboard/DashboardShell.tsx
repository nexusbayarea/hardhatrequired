'use client';

import { useState, useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import MetricsRow from './MetricsRow';
import SearchConsole from './SearchConsole';
import ResultsView from './ResultsView';
import type { SearchPane } from './SearchConsole';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';

interface SearchPaneData {
  data: { companies: SearchResult[]; count: number } | null;
  loading: boolean;
  error: string | null;
  vertical: string;
}

function emptyPane(): SearchPaneData {
  return { data: null, loading: false, error: null, vertical: '' };
}

type Tab = { id: SearchPane; label: string; disabled?: boolean };

const TABS: Tab[] = [
  { id: 'labor', label: 'Labor' },
  { id: 'disposal', label: 'Disposal' },
  { id: 'equipment', label: 'Equipment', disabled: true },
  { id: 'bids', label: 'Bids', disabled: true },
];

export default function DashboardShell() {
  const { t, language } = useLanguage();
  const [activePane, setActivePane] = useState<SearchPane>('labor');
  const [searchState, setSearchState] = useState<SearchPaneData>(emptyPane);

  const handleFeedback = useCallback(async (company: SearchResult, voteType: VoteType) => {
    if (!searchState.vertical) return;
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: company.id,
        companyName: company.companyName,
        vertical: searchState.vertical,
        voteType,
        leadScore: company.leadScore,
        signals: company.capabilitySummary,
      }),
    }).catch(() => {});
  }, [searchState.vertical]);

  const handleResults = useCallback(async (data: { companies: SearchResult[]; count: number; providerFailures?: string[] }) => {
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

    setSearchState(p => ({ ...p, data: { companies, count: companies.length }, loading: false }));
  }, [language]);

  const handleError = useCallback((error: string) => {
    setSearchState(p => ({ ...p, error, data: null, loading: false }));
  }, []);

  const handleSearchStart = useCallback(() => {
    setSearchState(p => ({ ...p, loading: true, error: null }));
  }, []);

  const setVertical = useCallback((v: string) => {
    setSearchState(p => ({ ...p, vertical: v }));
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      <MetricsRow />

      {/* Pane tabs */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {TABS.map(tab => {
            const isActive = activePane === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActivePane(tab.id)}
                disabled={tab.disabled}
                className="flex-1 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all"
                style={{
                  background: isActive ? 'var(--color-surface2)' : 'transparent',
                  color: tab.disabled
                    ? 'var(--color-border)'
                    : isActive
                      ? tab.id === 'disposal' ? '#3b82f6' : 'var(--color-red)'
                      : 'var(--color-muted)',
                  borderBottom: isActive ? `2px solid ${tab.id === 'disposal' ? '#3b82f6' : 'var(--color-red)'}` : '2px solid transparent',
                  cursor: tab.disabled ? 'not-allowed' : 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <SearchConsole
            onResults={handleResults}
            onError={handleError}
            onSearchStart={handleSearchStart}
            vertical={searchState.vertical}
            onVerticalChange={setVertical}
            activePane={activePane}
          />
        </div>
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
        <span className="inline-flex items-center gap-1.5 ml-2 text-xs" style={{ color: 'var(--color-muted)' }}>
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--color-green)' }} /> Operator
          <span className="inline-block w-2 h-2 rounded-full ml-2" style={{ background: 'var(--color-yellow)' }} /> Vendor
          <span className="inline-block w-2 h-2 rounded-full ml-2" style={{ background: '#3b82f6' }} /> Disposal
          <span className="inline-block w-2 h-2 rounded-full ml-2" style={{ background: '#a855f7' }} /> Permitted
        </span>
      </div>

      {/* Results */}
      <ResultsView
        results={searchState.data?.companies ?? null}
        loading={searchState.loading}
        error={searchState.error !== null}
        vertical={searchState.vertical}
        onFeedback={handleFeedback}
        activePane={activePane}
      />
    </div>
  );
}
