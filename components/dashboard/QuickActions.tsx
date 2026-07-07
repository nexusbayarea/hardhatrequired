'use client';

import { useSearchState } from '@/context/SearchStateContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLanguage } from '@/context/LanguageContext';
import { Droplets, Users, Truck } from 'lucide-react';

export default function QuickActions() {
  const { setActivePane } = useSearchState();
  const { setWorkspace } = useWorkspace();
  const { t } = useLanguage();

  const handleAction = (pane: 'disposal' | 'labor' | 'equipment') => {
    setWorkspace('search');
    setActivePane(pane);
  };

  return (
    <section className="quick-actions">
      <h2 className="quick-actions-title">{t('What do you need today?')}</h2>
      <div className="quick-actions-grid">
        <button
          className="quick-action-btn primary"
          onClick={() => handleAction('disposal')}
        >
          <Droplets className="w-7 h-7" />
          <span className="quick-action-label">{t('Find Disposal')}</span>
          <span className="quick-action-desc">{t('permitted facilities, tipping sites')}</span>
        </button>

        <button
          className="quick-action-btn"
          onClick={() => handleAction('labor')}
        >
          <Users className="w-7 h-7" />
          <span className="quick-action-label">{t('Find Labor')}</span>
          <span className="quick-action-desc">{t('crews, operators, contractors')}</span>
        </button>

        <button
          className="quick-action-btn"
          onClick={() => {
            setWorkspace('equipment');
          }}
        >
          <Truck className="w-7 h-7" />
          <span className="quick-action-label">{t('Rent Equipment')}</span>
          <span className="quick-action-desc">{t('vac trucks, heavy equipment, tools')}</span>
        </button>
      </div>
    </section>
  );
}
