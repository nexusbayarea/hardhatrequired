'use client';

import { useEffect, useState } from 'react';
import MetricCard, { MetricCardLoading } from './MetricCard';

export default function MetricsRow() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/overview', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(data => {
        if (data?.metrics) setMetrics(data.metrics);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = metrics ? [
    { label: 'Companies Indexed', value: metrics.totalCompanies?.toLocaleString() || '—', change: `${metrics.priorityDistribution?.A || 0} priority A`, positive: true },
    { label: 'Campaigns Active', value: String(metrics.activeCampaigns || '—'), change: `${metrics.callsToday || 0} calls today`, positive: true },
    { label: 'Monthly Searches', value: String(metrics.searchesToday || '—'), change: `${metrics.averageScore || '—'} avg score`, positive: true },
    { label: 'Pipeline Value', value: metrics.pipelineValue || '—', change: `${metrics.totalEnrichments || 0} enrichments`, positive: true },
  ] : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => <MetricCardLoading key={i} />)
        : cards?.map((m) => <MetricCard key={m.label} {...m} />)
      }
    </div>
  );
}
