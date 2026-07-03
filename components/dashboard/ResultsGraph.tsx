'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { SearchResult, FitType } from '@/types/search';
import type { SearchPane } from './SearchConsole';

interface ResultsGraphProps {
  results: SearchResult[];
  activePane: SearchPane;
  onSelect?: (company: SearchResult) => void;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'root' | 'operator' | 'disposal' | 'equipment' | 'vendor' | 'permit';
  count: number;
  children?: GraphNode[];
}

const NODE_COLORS: Record<string, string> = {
  root: 'var(--color-indigo)',
  operator: 'var(--color-blue)',
  disposal: 'var(--color-green)',
  equipment: 'var(--color-pink)',
  vendor: 'var(--color-yellow)',
  permit: 'var(--color-purple)',
};

const FIT_TYPE_MAP: Record<string, GraphNode['type']> = {
  DIRECT_OPERATOR: 'operator',
  DISPOSAL_NODE: 'disposal',
  REGULATORY_NODE: 'permit',
  INDIRECT_VENDOR: 'vendor',
};

function resolveChildType(fitType: FitType | null | undefined): GraphNode['type'] {
  if (!fitType) return 'vendor';
  return FIT_TYPE_MAP[fitType] || 'vendor';
}

function buildGraph(results: SearchResult[]): GraphNode[] {
  const groups = new Map<string, SearchResult[]>();

  for (const r of results) {
    const key = r.fitType ?? 'OTHER';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return Array.from(groups.entries()).map(([fitType, companies]) => {
    const rootType = fitType === 'DISPOSAL_NODE' ? 'disposal' : 'operator';
    const children: GraphNode[] = companies.map(c => ({
      id: c.id,
      label: c.companyName,
      type: resolveChildType(c.fitType),
      count: 1,
    }));

    return {
      id: fitType,
      label: fitType.replace(/_/g, ' '),
      type: 'root' as const,
      count: companies.length,
      children,
    };
  });
}

export default function ResultsGraph({ results, activePane, onSelect }: ResultsGraphProps) {
  const { t } = useLanguage();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedRoots, setExpandedRoots] = useState<Set<string>>(new Set());

  const graph = useMemo(() => buildGraph(results), [results]);

  const toggleRoot = (id: string) => {
    setExpandedRoots(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node.id);
    if (node.type !== 'root' && onSelect) {
      const company = results.find(r => r.id === node.id);
      if (company) onSelect(company);
    }
  };

  return (
    <div
      className="rounded-xl p-6"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 text-xs flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
          {t('ontology graph')}
        </span>
        {(Object.entries(NODE_COLORS) as [string, string][]).map(([type, color]) => (
          <span key={type} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span style={{ color: 'var(--color-muted)' }}>{type}</span>
          </span>
        ))}
      </div>

      {/* Graph tree */}
      <div className="space-y-3">
        {graph.length === 0 ? (
          <div className="text-sm py-8 text-center" style={{ color: 'var(--color-muted)' }}>
            {t('no results to display in graph view')}
          </div>
        ) : (
          graph.map(root => (
            <div key={root.id}>
              {/* Root node */}
              <button
                onClick={() => toggleRoot(root.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors"
                style={{
                  background: expandedRoots.has(root.id) ? 'var(--color-surface2)' : 'transparent',
                  border: `1px solid ${expandedRoots.has(root.id) ? 'var(--color-border)' : 'transparent'}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: NODE_COLORS[root.type] }}
                >
                  {root.count}
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    {root.label}
                  </div>
                  <div className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>
                    {root.count} {t('results')}
                  </div>
                </div>
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-xs transition-transform"
                  style={{
                    transform: expandedRoots.has(root.id) ? 'rotate(90deg)' : 'rotate(0deg)',
                    color: 'var(--color-muted)',
                  }}
                >
                  ▶
                </div>
              </button>

              {/* Children */}
              {expandedRoots.has(root.id) && root.children && (
                <div className="ml-6 mt-1 pl-4 space-y-1" style={{ borderLeft: '2px solid var(--color-border)' }}>
                  {root.children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => handleNodeClick(child)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-lg transition-colors"
                      style={{
                        background: selectedNode === child.id ? 'color-mix(in srgb, var(--color-indigo) 8%, var(--color-surface2))' : 'transparent',
                        border: selectedNode === child.id ? '1px solid color-mix(in srgb, var(--color-indigo) 25%, transparent)' : '1px solid transparent',
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: NODE_COLORS[child.type] }}
                      />
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-xs font-bold truncate" style={{ color: 'var(--color-text)' }}>
                          {child.label}
                        </div>
                      </div>
                      <div
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0"
                        style={{
                          background: `color-mix(in srgb, ${NODE_COLORS[child.type]} 12%, transparent)`,
                          color: NODE_COLORS[child.type],
                        }}
                      >
                        {child.type}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
