'use client';

import React from 'react';
import { getProduct } from '@iie/product-manifests';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLanguage } from '@/context/LanguageContext';

export function RuntimeSidebar({
  productId = 'hhr',
  collapsed,
  onToggleCollapse,
}: {
  productId?: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { workspace, setWorkspace } = useWorkspace();
  const { t } = useLanguage();
  const manifest = getProduct(productId);
  const navItems = manifest?.workspaces?.filter(w => w.id !== 'settings') ?? [];

  return (
    <aside
      className={`flex flex-col h-full transition-all duration-200 ${collapsed ? 'w-[72px]' : 'w-[280px]'}`}
      style={{
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      <div className={`px-4 py-5 border-b flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--color-red)' }}
        >
          <span className="text-white font-black text-sm">{manifest?.name?.charAt(0) || 'I'}</span>
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--color-text)' }}>
            {manifest?.name || 'IIE'}
          </span>
        )}
      </div>

      <nav className="flex-1 py-3 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = workspace === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setWorkspace(item.id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                active
                  ? 'bg-red-600/10 text-red-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={collapsed ? item.label : undefined}
              type="button"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-red-500' : 'bg-slate-600'}`} />
              {!collapsed && (
                <span className="truncate">{t(item.label)}</span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
