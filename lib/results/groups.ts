import type { SearchResult, FitType } from '@/types/search';

export interface FitTypeGroup {
  fitType: FitType | 'OTHER';
  label: string;
  icon: string;
  results: SearchResult[];
}

export type SectionPane = 'labor' | 'disposal';

const SECTION_CONFIG: { fitType: FitType | 'OTHER'; label: string; icon: string; order: number; pane?: SectionPane }[] = [
  { fitType: 'DIRECT_OPERATOR', label: 'Labor Contractors', icon: '🔧', order: 0, pane: 'labor' },
  { fitType: 'INDIRECT_VENDOR', label: 'Support Services', icon: '🚛', order: 1, pane: 'labor' },
  { fitType: 'DISPOSAL_NODE', label: 'Disposal Facilities', icon: '♻️', order: 2, pane: 'disposal' },
  { fitType: 'REGULATORY_NODE', label: 'Permitted Facilities', icon: '📋', order: 3 },
  { fitType: 'OTHER', label: 'Other', icon: '📌', order: 4 },
];

export function groupResults(results: SearchResult[], pane?: string): FitTypeGroup[] {
  const groups = new Map<FitType | 'OTHER', FitTypeGroup>();

  for (const config of SECTION_CONFIG) {
    if (pane && config.pane && config.pane !== pane) continue;
    groups.set(config.fitType, { ...config, results: [] });
  }

  for (const r of results) {
    const key = r.fitType ?? 'OTHER';
    const group = groups.get(key);
    if (group) {
      group.results.push(r);
    } else if (!pane) {
      groups.get('OTHER')!.results.push(r);
    }
  }

  return Array.from(groups.values())
    .filter(g => g.results.length > 0)
    .sort((a, b) => {
      const aOrder = SECTION_CONFIG.find(c => c.fitType === a.fitType)?.order ?? 99;
      const bOrder = SECTION_CONFIG.find(c => c.fitType === b.fitType)?.order ?? 99;
      return aOrder - bOrder;
    });
}

export const FIT_COLORS: Record<string, { bg: string; text: string }> = {
  DIRECT_OPERATOR: { bg: 'color-mix(in srgb, #3b82f6 14%, transparent)', text: '#3b82f6' },
  INDIRECT_VENDOR: { bg: 'color-mix(in srgb, var(--color-yellow) 14%, transparent)', text: 'var(--color-yellow)' },
  DISPOSAL_NODE: { bg: 'color-mix(in srgb, var(--color-green) 14%, transparent)', text: 'var(--color-green)' },
  REGULATORY_NODE: { bg: 'color-mix(in srgb, #a855f7 14%, transparent)', text: '#a855f7' },
};

export const FIT_ICONS: Record<string, string> = {
  DIRECT_OPERATOR: '🔧',
  INDIRECT_VENDOR: '🚛',
  DISPOSAL_NODE: '♻️',
  REGULATORY_NODE: '📋',
};

export function getFitTypeLabel(fitType: FitType | null | undefined): string {
  if (!fitType) return 'Other';
  const config = SECTION_CONFIG.find(c => c.fitType === fitType);
  return config?.label ?? 'Other';
}
