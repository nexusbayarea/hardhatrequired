'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HardHat, LayoutDashboard, Search, Truck, Repeat, Gavel, TrendingUp,
  Bookmark, BookmarkCheck, Folder, Settings, PlusCircle, Globe,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useProject } from '@/context/ProjectContext';
import NewProjectModal from '@/components/shared/NewProjectModal';

const primaryNav = [
  { id: 'command-center',  icon: LayoutDashboard, label: 'command center' },
  { id: 'search',          icon: Search,          label: 'search intelligence' },
  { id: 'logistics',       icon: Truck,           label: 'logistics intelligence' },
  { id: 'equipment',       icon: Repeat,          label: 'equipment exchange' },
  { id: 'bids',            icon: Gavel,           label: 'bid intelligence' },
  { id: 'market',          icon: TrendingUp,      label: 'market intelligence' },
];

interface SidebarProps {
  slim?: boolean;
}

export default function Sidebar({ slim = false }: SidebarProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { workspace, setWorkspace } = useWorkspace();
  const { projects, activeProjectId, setActiveProject, createProject } = useProject();
  const [showNewModal, setShowNewModal] = useState(false);

  const handleNav = useCallback((id: string) => {
    setWorkspace(id as any);
  }, [setWorkspace]);

  return (
    <>
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
          <button onClick={() => router.push('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
        <nav className="overflow-y-auto py-4 px-2 space-y-1 flex-1">
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
                      className="truncate"
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

          {/* Project list */}
          {!slim && (
            <>
              <div
                className="px-4 my-3 pt-3 border-t flex items-center justify-between"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                  {t('projects')}
                </span>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="text-xs flex items-center gap-1 font-semibold"
                  style={{ color: 'var(--color-blue)' }}
                >
                  <PlusCircle className="w-3 h-3" /> {t('new')}
                </button>
              </div>
              <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
                {projects.map(p => {
                  const isSelected = p.id === activeProjectId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setActiveProject(p.id); handleNav('search'); }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg transition-all text-xs ${
                        isSelected
                          ? 'bg-slate-950 border border-indigo-500/30'
                          : 'hover:bg-slate-900/60 border border-transparent'
                      }`}
                    >
                      <div className="font-bold truncate" style={{ color: isSelected ? 'var(--color-text)' : 'var(--color-muted)' }}>
                        {p.name}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        <span>{p.volume.toLocaleString()} gal</span>
                        <span>ZIP {p.zip}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-green)' }} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Global Hub */}
              <div className="pt-2 px-2">
                <button
                  onClick={() => { setActiveProject(null); handleNav('search'); }}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-2.5 text-xs font-bold tracking-wide uppercase transition-all ${
                    activeProjectId === null
                      ? 'bg-slate-950 text-indigo-400 border border-indigo-500/20'
                      : 'text-slate-500 border border-transparent hover:text-slate-300'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  {t('global exploration hub')}
                </button>
              </div>
            </>
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

      <NewProjectModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSubmit={data => {
          createProject(data);
          setShowNewModal(false);
          setWorkspace('search');
        }}
      />
    </>
  );
}
