'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import MetricCard, { MetricCardLoading } from './MetricCard';

export default function MetricsRow() {
  const { t } = useLanguage();
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
    { label: t('companies indexed'), value: metrics.totalCompanies?.toLocaleString() || '—', change: `${metrics.priorityDistribution?.A || 0} ${t('priority a')}`, positive: true },
    { label: t('campaigns active'), value: String(metrics.activeCampaigns || '—'), change: `${metrics.callsToday || 0} ${t('calls today')}`, positive: true },
    { label: t('monthly searches'), value: String(metrics.searchesToday || '—'), change: `${metrics.averageScore || '—'} ${t('avg score')}`, positive: true },
    { label: t('pipeline value'), value: metrics.pipelineValue || '—', change: `${metrics.totalEnrichments || 0} ${t('enrichments')}`, positive: true },
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
