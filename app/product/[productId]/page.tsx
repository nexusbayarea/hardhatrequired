'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getProduct } from '@iie/product-manifests';
import { RuntimeSidebar } from '@/components/dashboard/RuntimeSidebar';
import { UniversalWorkspaceEngine } from '@/components/dashboard/UniversalWorkspaceEngine';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLanguage } from '@/context/LanguageContext';
import { Search, Menu } from 'lucide-react';

export default function ProductPage() {
  const params = useParams();
  const productId = (params.productId as string) || 'hhr';
  const { workspace, setWorkspace } = useWorkspace();
  const { t } = useLanguage();
  const manifest = getProduct(productId);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    if (manifest?.defaultWorkspace && !workspace) {
      setWorkspace(manifest.defaultWorkspace as any);
    }
  }, [manifest]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!manifest) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-400">Product not found</h1>
          <p className="text-slate-600 mt-2">{productId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <RuntimeSidebar
          productId={productId}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header
          className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            height: '64px',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(v => !v)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
              type="button"
            >
              <Menu className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
            </button>
            <div>
              <h1 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                {manifest.name}
              </h1>
              <p className="text-xs text-slate-500">
                {manifest.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background: 'var(--color-surface2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-muted)',
            }}
            type="button"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('Search...')}</span>
            <kbd className="text-[10px] px-1 py-0.5 rounded font-mono" style={{ background: 'var(--color-bg)' }}>
              ⌘K
            </kbd>
          </button>
        </header>

        {/* Workspace Content */}
        <main className="flex-1 overflow-y-auto" style={{ zoom: 1.25 }}>
          <UniversalWorkspaceEngine workspaceId={workspace} productId={productId} />
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          className="lg:hidden flex items-center justify-around border-t shrink-0"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            height: '64px',
          }}
        >
          {manifest.workspaces.filter(w => w.id !== 'settings').slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => setWorkspace(item.id as any)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold transition-colors"
              style={{
                color: workspace === item.id ? 'var(--color-red, #ef4444)' : 'var(--color-muted)',
              }}
              type="button"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${workspace === item.id ? 'bg-red-500' : 'bg-slate-600'}`} />
              <span className="truncate max-w-[60px]">{t(item.label)}</span>
            </button>
          ))}
        </nav>
      </div>

      <CommandPalette productId={productId} open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
