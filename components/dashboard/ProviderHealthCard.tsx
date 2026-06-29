'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface ProviderHealth {
  name: string;
  pct: number;
}

const DEFAULT_PROVIDERS = [
  { name: 'Google API', pct: 0 },
  { name: 'Apollo API', pct: 0 },
  { name: 'DeepSeek API', pct: 0 },
  { name: 'Campaign Engine', pct: 0 },
];

const colorFor = (pct: number) => {
  if (pct >= 97) return 'text-green';
  if (pct >= 90) return 'text-yellow';
  if (pct === 0) return 'text-muted';
  return 'text-red';
};

const barColor = (pct: number) => {
  if (pct >= 97) return 'bg-green';
  if (pct >= 90) return 'bg-yellow';
  if (pct === 0) return 'bg-surface2';
  return 'bg-red';
};

export default function ProviderHealthCard() {
  const [providers, setProviders] = useState<ProviderHealth[]>(DEFAULT_PROVIDERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/admin/metrics', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.json())
      .then(data => {
        if (data?.metrics) {
          setProviders([
            { name: 'Google API', pct: data.metrics.google_status === 'healthy' ? 98 : 70 },
            { name: 'Apollo API', pct: data.metrics.apollo_status === 'healthy' ? 94 : 70 },
            { name: 'DeepSeek API', pct: data.metrics.deepseek_status === 'healthy' ? 99 : 70 },
            { name: 'Campaign Engine', pct: data.metrics.campaign_status === 'healthy' ? 97 : 70 },
          ]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-surface border border-border flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 text-muted animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-surface border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-semibold text-muted uppercase tracking-wider">Provider Health</div>
        {error && <AlertCircle className="w-3.5 h-3.5 text-yellow" />}
      </div>
      <div className="space-y-4">
        {providers.map((p) => (
          <div key={p.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted">{p.name}</span>
              <span className={`font-semibold ${colorFor(p.pct)}`}>{p.pct > 0 ? `${p.pct}%` : 'Unknown'}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface2 overflow-hidden">
              <div className={`h-full rounded-full ${barColor(p.pct)}`} style={{ width: `${Math.max(p.pct, 4)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
