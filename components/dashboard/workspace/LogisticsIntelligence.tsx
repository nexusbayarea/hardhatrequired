'use client';

import { useLanguage } from '@/context/LanguageContext';
import LogisticsController from '@/components/dashboard/LogisticsController';
import { useSearchState } from '@/context/SearchStateContext';

export default function LogisticsIntelligence() {
  const { t } = useLanguage();
  const { searchState } = useSearchState();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          {t('logistics intelligence')}
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
          {t('route analysis, cost modeling, crew planning, and vendor comparison')}
        </p>
      </div>

      <LogisticsController
        targetVolume={3000}
        onVolumeChange={() => {}}
        vertical={searchState.vertical || 'slurry_processing'}
      />

      {searchState.data?.companies && searchState.data.companies.length > 0 && (
        <div
          className="rounded-xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text)' }}>
            {t('vendor cost comparison')}
          </h3>
          <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
            {t('run a search in Search Intelligence to populate vendor data here.')}
          </p>
        </div>
      )}
    </div>
  );
}
