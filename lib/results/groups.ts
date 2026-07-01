import type { SearchResult, FitType } from '@/types/search';

export interface FitTypeGroup {
  fitType: FitType | 'OTHER';
  label: string;
  icon: string;
  results: SearchResult[];
}

const SECTION_CONFIG: { fitType: FitType | 'OTHER'; label: string; icon: string; order: number }[] = [
  { fitType: 'DIRECT_OPERATOR', label: 'Labor Contractors', icon: '🔧', order: 0 },
  { fitType: 'INDIRECT_VENDOR', label: 'Support Services', icon: '🚛', order: 1 },
  { fitType: 'DISPOSAL_NODE', label: 'Disposal Facilities', icon: '♻️', order: 2 },
  { fitType: 'REGULATORY_NODE', label: 'Permitted Facilities', icon: '📋', order: 3 },
  { fitType: 'OTHER', label: 'Other', icon: '📌', order: 4 },
];

export function groupResults(results: SearchResult[]): FitTypeGroup[] {
  const groups = new Map<FitType | 'OTHER', FitTypeGroup>();

  for (const config of SECTION_CONFIG) {
    groups.set(config.fitType, { ...config, results: [] });
  }

  for (const r of results) {
    const key = r.fitType ?? 'OTHER';
    const group = groups.get(key);
    if (group) {
      group.results.push(r);
    } else {
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

export function getFitTypeLabel(fitType: FitType | null | undefined): string {
  if (!fitType) return 'Other';
  const config = SECTION_CONFIG.find(c => c.fitType === fitType);
  return config?.label ?? 'Other';
}
