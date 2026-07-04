'use client';

import { useCallback, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useSearchState } from '@/context/SearchStateContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useProject } from '@/context/ProjectContext';
import MetricsRow from './MetricsRow';
import SearchConsole from './SearchConsole';
import ResultsView from './ResultsView';
import CommandBar from './CommandBar';
import IntelligenceRail from './IntelligenceRail';
import LogisticsController from './LogisticsController';
import CopilotDrawer from '@/components/ai/CopilotDrawer';
import LanguageToggle from '@/components/shared/LanguageToggle';
import Toast from '@/components/shared/Toast';
import CommandCenter from './workspace/CommandCenter';
import SearchIntelligence from './workspace/SearchIntelligence';
import LogisticsIntelligence from './workspace/LogisticsIntelligence';
import EquipmentExchange from './workspace/EquipmentExchange';
import BidIntelligence from './workspace/BidIntelligence';
import MarketIntelligence from './workspace/MarketIntelligence';
import SavedItems from './workspace/SavedItems';
import { getVerticalEstimatorConfig } from '@/lib/logistics/normalizer';
import type { SearchPane } from './SearchConsole';
import type { SearchResult } from '@/types/search';
import type { VoteType } from '@/types/feedback';

type Tab = { id: SearchPane; label: string; beta?: boolean };

const TABS: Tab[] = [
  { id: 'labor', label: 'Labor' },
  { id: 'disposal', label: 'Disposal' },
  { id: 'equipment', label: 'Equipment', beta: true },
  { id: 'bids', label: 'Bids', beta: true },
];

export default function DashboardShell() {
  const { t, language } = useLanguage();
  const { searchState, setSearchState, activePane, setActivePane } = useSearchState();
  const { workspace, setWorkspace } = useWorkspace();
  const { activeProject, toast, clearToast } = useProject();
  const defaultVolume = 3000;
  const [targetVolume, setTargetVolume] = useState(defaultVolume);

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

    if (language !== 'en' && companies.length > 0) {
      const summaries = companies.map(c => c.capabilitySummary || '');
      try {
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: summaries, target: language }),
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

  const isSearchWorkspace = workspace === 'search' || workspace === 'logistics' || workspace === 'equipment' || workspace === 'bids';
  const showRail = workspace === 'search' || workspace === 'logistics';

  const renderWorkspace = () => {
    switch (workspace) {
      case 'command-center':
        return <CommandCenter />;

      case 'search':
        return (
          <>
            {/* Project context header */}
            {activeProject && (
              <div className="project-context-header rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span>{t('project workspace')}</span>
                    <span className="text-[8px]">▶</span>
                    <span className="font-semibold uppercase tracking-wider text-indigo">
                      {activeProject.vertical.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mt-0.5 text-text">
                    {activeProject.name}
                  </h2>
                  <div className="text-xs mt-0.5 text-muted">
                    {activeProject.zip} · {activeProject.radius} mi geofence · {activeProject.volume.toLocaleString()} gal
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted">
                    <div className="font-bold text-text">{activeProject.linkedVendors.length}</div>
                    <div>{t('vendors')}</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-xs text-muted">
                    <div className="font-bold text-text">{activeProject.bookedEquipment.length}</div>
                    <div>{t('equipment')}</div>
                  </div>
                </div>
              </div>
            )}

            <SearchIntelligence
              onResults={handleResults}
              onError={handleError}
              onSearchStart={handleSearchStart}
              vertical={searchState.vertical}
              onVerticalChange={setVertical}
              onFeedback={handleFeedback}
            />

            {searchState.data?.companies && searchState.data.companies.length > 0 && (
              <>
                <LogisticsController
                  targetVolume={targetVolume}
                  onVolumeChange={setTargetVolume}
                  vertical={searchState.vertical}
                />
                <ResultsView
                  results={searchState.data?.companies ?? null}
                  loading={searchState.loading}
                  error={searchState.error !== null}
                  vertical={searchState.vertical}
                  projectVolume={targetVolume}
                  onVolumeChange={setTargetVolume}
                  onFeedback={handleFeedback}
                  activePane={activePane}
                />
              </>
            )}
          </>
        );

      case 'logistics':
        return <LogisticsIntelligence />;

      case 'equipment':
        return <EquipmentExchange />;

      case 'bids':
        return <BidIntelligence />;

      case 'market':
        return <MarketIntelligence />;

      case 'saved-searches':
      case 'saved-vendors':
      case 'projects':
        return <SavedItems type={workspace} />;

      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-black tracking-tight text-text">
              {t('settings')}
            </h1>
          </div>
        );

      default:
        return <CommandCenter />;
    }
  };

  return (
    <>
      <div className={`grid grid-cols-1 ${workspace === 'command-center' || workspace === 'market' || workspace === 'bids' || workspace === 'equipment' ? '' : 'xl:grid-cols-[1fr_340px]'} gap-6 md:gap-8`}>
        <div className="min-w-0 space-y-6 md:space-y-8">
          {/* Metrics + CommandBar only shown on search/logistics workspaces */}
          {isSearchWorkspace && (
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <MetricsRow />
                <div className="mt-6 md:mt-8">
                  <CommandBar />
                </div>
              </div>
              <div className="hidden md:block shrink-0 pt-1">
                <LanguageToggle />
              </div>
            </div>
          )}

          {renderWorkspace()}
        </div>

        {/* Right rail */}
        {showRail && (
          <aside className="hidden xl:block space-y-6 pt-1">
            <IntelligenceRail />
          </aside>
        )}

        <CopilotDrawer />
      </div>

      <Toast message={toast} onClose={clearToast} />
    </>
  );
}
