'use client';

import { useSearchState } from '@/context/SearchStateContext';
import { useLanguage } from '@/context/LanguageContext';
import { Users, Truck, Route, Bot } from 'lucide-react';
import type { SearchPane } from './SearchConsole';

const ACTIONS: { id: SearchPane | 'route' | 'copilot'; label: string; icon: typeof Users }[] = [
  { id: 'labor', label: 'Labor', icon: Users },
  { id: 'equipment', label: 'Equipment', icon: Truck },
  { id: 'route', label: 'Route', icon: Route },
  { id: 'copilot', label: 'AI', icon: Bot },
];

export default function BottomActionBar() {
  const { activePane, setActivePane } = useSearchState();
  const { t } = useLanguage();

  return (
    <nav className="bottom-action-bar">
      {ACTIONS.map(({ id, label, icon: Icon }) => {
        const isSearchAction = id === 'labor' || id === 'equipment';
        const active = isSearchAction && activePane === id;
        return (
          <button
            key={id}
            onClick={() => {
              if (id === 'copilot') {
                window.dispatchEvent(new CustomEvent('open-copilot'));
                return;
              }
              if (id === 'route') {
                window.dispatchEvent(new CustomEvent('open-logistics'));
                return;
              }
              if (isSearchAction) {
                setActivePane(id);
              }
            }}
            className={`bottom-action-bar-item ${active ? 'active' : ''}`}
          >
            <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.8} />
            <span>{t(label)}</span>
          </button>
        );
      })}
    </nav>
  );
}
