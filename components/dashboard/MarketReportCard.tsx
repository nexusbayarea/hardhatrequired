import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface MarketReport {
  marketSize?: string;
  competitiveDensity?: string;
  opportunityIndex?: number;
  coverageScore?: number;
}

export default function MarketReportCard({ marketSize, competitiveDensity, opportunityIndex, coverageScore }: MarketReport) {
  const items = [
    { label: 'Market Size', value: marketSize || '—' },
    { label: 'Competitive Density', value: competitiveDensity || '—' },
    { label: 'Opportunity Index', value: opportunityIndex ? `${opportunityIndex}/100` : '—' },
    { label: 'Coverage Score', value: coverageScore ? `${coverageScore}%` : '—' },
  ];

  return (
    <div className="p-6 rounded-2xl bg-surface border border-border">
      <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Market Intelligence Report</div>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-xs text-muted">{item.label}</span>
            <span className="text-sm font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarketReportLoading() {
  return (
    <div className="p-6 rounded-2xl bg-surface border border-border flex items-center justify-center h-32">
      <Loader2 className="w-5 h-5 text-muted animate-spin" />
    </div>
  );
}
