'use client';

import { useSearchState } from '@/context/SearchStateContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLanguage } from '@/context/LanguageContext';
import { Droplets, Users, Truck } from 'lucide-react';

const PANE_COLORS: Record<string, string> = {
  disposal: 'var(--color-green)',
  labor: 'var(--color-red)',
  equipment: 'var(--color-purple)',
};

export default function QuickActions() {
  const { setActivePane, activePane } = useSearchState();
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
          className={`quick-action-btn${activePane === 'disposal' ? ' primary' : ''}`}
          onClick={() => handleAction('disposal')}
          style={activePane === 'disposal' ? { background: PANE_COLORS.disposal, borderColor: PANE_COLORS.disposal } : {}}
        >
          <Droplets className="w-7 h-7" />
          <span className="quick-action-label">{t('Find Disposal')}</span>
          <span className="quick-action-desc">{t('permitted facilities, tipping sites')}</span>
        </button>

        <button
          className={`quick-action-btn${activePane === 'labor' ? ' primary' : ''}`}
          onClick={() => handleAction('labor')}
          style={activePane === 'labor' ? { background: PANE_COLORS.labor, borderColor: PANE_COLORS.labor } : {}}
        >
          <Users className="w-7 h-7" />
          <span className="quick-action-label">{t('Find Labor')}</span>
          <span className="quick-action-desc">{t('crews, operators, contractors')}</span>
        </button>

        <button
          className={`quick-action-btn${activePane === 'equipment' ? ' primary' : ''}`}
          onClick={() => {
            setWorkspace('equipment');
          }}
          style={activePane === 'equipment' ? { background: PANE_COLORS.equipment, borderColor: PANE_COLORS.equipment } : {}}
        >
          <Truck className="w-7 h-7" />
          <span className="quick-action-label">{t('Rent Equipment')}</span>
          <span className="quick-action-desc">{t('vac trucks, heavy equipment, tools')}</span>
        </button>
      </div>
    </section>
  );
}
