'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getProduct } from '@iie/product-manifests';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLanguage } from '@/context/LanguageContext';
import { Search, ArrowUpRight, Command } from 'lucide-react';

export function CommandPalette({
  productId = 'hhr',
  open,
  onClose,
}: {
  productId?: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const { workspace, setWorkspace } = useWorkspace();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const manifest = getProduct(productId);

  const allActions = [
    ...(manifest?.workspaces?.map(w => ({
      id: w.id,
      label: w.label,
      description: w.description,
      type: 'workspace' as const,
      action: () => setWorkspace(w.id as any),
    })) || []),
    ...(manifest?.routes?.filter(r => r.showInNav).map(r => ({
      id: r.path,
      label: r.label,
      description: `Navigate to ${r.path}`,
      type: 'route' as const,
      action: () => { window.location.href = r.path; },
    })) || []),
  ];

  const filtered = query
    ? allActions.filter(a =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.description.toLowerCase().includes(query.toLowerCase())
      )
    : allActions;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else onClose(); // toggle handled by parent
        return;
      }

      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered[selectedIndex]) {
            filtered[selectedIndex].action();
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, filtered, selectedIndex, onClose]);

  const executeAction = useCallback((action: typeof allActions[0]) => {
    action.action();
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder={t('Search workspaces and commands...')}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text)' }}
          />
          <kbd className="text-xs px-1.5 py-0.5 rounded font-mono text-slate-400"
            style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
          >
            <Command className="w-3 h-3 inline" />K
          </kbd>
        </div>

        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              {t('No results found')}
            </div>
          ) : filtered.map((action, i) => (
            <button
              key={action.id}
              onClick={() => executeAction(action)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
              style={{
                background: i === selectedIndex ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                color: 'var(--color-text)',
              }}
              type="button"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <div className="text-left flex-1 min-w-0">
                <div className="font-medium truncate">{t(action.label)}</div>
                <div className="text-[11px] text-slate-500 truncate">{action.description}</div>
              </div>
              <span className="text-xs uppercase tracking-wider text-slate-500 shrink-0">
                {action.type === 'workspace' ? t('Workspace') : t('Page')}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
