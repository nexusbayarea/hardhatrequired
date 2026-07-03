'use client';

import { useCallback } from 'react';
import {
  HardHat, LayoutDashboard, Search, Truck, Repeat, Gavel, TrendingUp,
  Bookmark, BookmarkCheck, Folder, Settings,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWorkspace } from '@/context/WorkspaceContext';

const primaryNav = [
  { id: 'command-center',  icon: LayoutDashboard, label: 'command center' },
  { id: 'search',          icon: Search,          label: 'search intelligence' },
  { id: 'logistics',       icon: Truck,           label: 'logistics intelligence' },
  { id: 'equipment',       icon: Repeat,          label: 'equipment exchange' },
  { id: 'bids',            icon: Gavel,           label: 'bid intelligence' },
  { id: 'market',          icon: TrendingUp,      label: 'market intelligence' },
];

const secondaryNav = [
  { id: 'saved-searches', icon: Bookmark,    label: 'saved searches' },
  { id: 'saved-vendors',  icon: BookmarkCheck, label: 'saved vendors' },
  { id: 'projects',       icon: Folder,      label: 'projects' },
];

interface SidebarProps {
  slim?: boolean;
}

export default function Sidebar({ slim = false }: SidebarProps) {
  const { t } = useLanguage();
  const { workspace, setWorkspace } = useWorkspace();

  const handleNav = useCallback((id: string) => {
    setWorkspace(id as any);
  }, [setWorkspace]);

  return (
    <aside
      className={`shrink-0 min-h-screen flex flex-col border-r transition-all duration-200`}
      style={{
        width: slim ? '72px' : '280px',
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo */}
      <div
        className="h-20 flex items-center justify-center gap-3 border-b shrink-0 px-4"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <button onClick={() => handleNav('command-center')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-red)' }}
          >
            <HardHat className="w-5 h-5 text-white" />
          </div>
          {!slim && (
            <span
              className="font-black text-lg leading-none"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '-0.01em',
                color: 'var(--color-text)',
              }}
            >
              HHR
            </span>
          )}
        </button>
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <div className="space-y-0.5">
          {primaryNav.map((item) => {
            const active = workspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                title={slim ? item.label : undefined}
                className={`nav-item ${active ? 'active' : ''} ${slim ? 'justify-center px-0' : ''}`}
                style={slim ? { borderLeft: 'none', borderRadius: '8px' } : {}}
              >
                <item.icon
                  className="shrink-0"
                  style={{
                    width: '22px',
                    height: '22px',
                    color: active ? 'var(--color-red)' : 'var(--color-muted)',
                    strokeWidth: active ? 2.5 : 1.8,
                  }}
                />
                {!slim && (
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: active ? 'var(--color-red)' : undefined,
                    }}
                  >
                    {t(item.label)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {!slim && (
          <div
            className="px-4 my-4 pt-4 border-t text-[10px] font-black uppercase tracking-widest"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            {t('saved')}
          </div>
        )}

        <div className="space-y-0.5">
          {secondaryNav.map((item) => {
            const active = workspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                title={slim ? item.label : undefined}
                className={`nav-item ${active ? 'active' : ''} ${slim ? 'justify-center px-0' : ''}`}
                style={slim ? { borderLeft: 'none', borderRadius: '8px' } : {}}
              >
                <item.icon
                  className="shrink-0"
                  style={{
                    width: '22px',
                    height: '22px',
                    color: active ? 'var(--color-red)' : 'var(--color-muted)',
                    strokeWidth: active ? 2.5 : 1.8,
                  }}
                />
                {!slim && (
                  <span
                    style={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: active ? 'var(--color-red)' : undefined,
                    }}
                  >
                    {t(item.label)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Settings at bottom */}
        {!slim && (
          <div className="pt-4 mt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => handleNav('settings')}
              className={`nav-item ${workspace === 'settings' ? 'active' : ''}`}
            >
              <Settings
                className="shrink-0"
                style={{
                  width: '22px',
                  height: '22px',
                  color: workspace === 'settings' ? 'var(--color-red)' : 'var(--color-muted)',
                  strokeWidth: workspace === 'settings' ? 2.5 : 1.8,
                }}
              />
              <span
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: workspace === 'settings' ? 'var(--color-red)' : undefined,
                }}
              >
                {t('settings')}
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        className="px-2 py-4 border-t shrink-0 space-y-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {!slim && (
          <div
            className="px-4 py-4 rounded-xl"
            style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="text-xs font-black uppercase tracking-wider mb-1"
              style={{ color: 'var(--color-muted)' }}
            >
              {t('growth plan')}
            </div>
            <div
              className="font-bold"
              style={{ fontSize: '1.0625rem', color: 'var(--color-text)' }}
            >
              {t('credits')}
            </div>
          </div>
        )}

        <div className="px-4">
          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
            © 2026 Hard Hat Required. All rights reserved.
          </span>
        </div>
      </div>
    </aside>
  );
}
