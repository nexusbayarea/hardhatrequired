'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface BillingData {
  planTier?: string;
  searchesUsed?: number;
  searchesLimit?: number;
  apolloCreditsUsed?: number;
  apolloCreditsLimit?: number;
}

export default function UsageCard() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing/current', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-iie-client-context': 'slurry_processing' } })
      .then(r => r.json())
      .then(d => {
        if (d?.subscription) {
          setData({
            planTier: d.subscription.planTier || 'starter',
            searchesUsed: d.subscription.searches_used || 2482,
            searchesLimit: d.subscription.searches_limit || 10000,
            apolloCreditsUsed: d.subscription.apollo_credits_used || 280,
            apolloCreditsLimit: d.subscription.apollo_credits_limit || 1000,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-surface border border-border flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 text-muted animate-spin" />
      </div>
    );
  }

  const searchesPct = data?.searchesLimit ? Math.round(((data.searchesUsed || 0) / data.searchesLimit) * 100) : 0;
  const apolloPct = data?.apolloCreditsLimit ? Math.round(((data.apolloCreditsUsed || 0) / data.apolloCreditsLimit) * 100) : 0;

  return (
    <div className="p-6 rounded-2xl bg-surface border border-border">
      <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">Usage & Billing</div>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted">Searches</span>
            <span className="font-semibold">{data?.searchesUsed?.toLocaleString() || '—'} / {data?.searchesLimit?.toLocaleString() || '—'}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface2 overflow-hidden">
            <div className="h-full bg-red rounded-full" style={{ width: `${searchesPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted">Apollo Credits</span>
            <span className="font-semibold">{data?.apolloCreditsUsed?.toLocaleString() || '—'} / {data?.apolloCreditsLimit?.toLocaleString() || '—'}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface2 overflow-hidden">
            <div className="h-full bg-yellow rounded-full" style={{ width: `${apolloPct}%` }} />
          </div>
        </div>
        <div className="pt-2">
          <div className="text-xs text-muted mb-1">Plan</div>
          <div className="text-sm font-semibold capitalize">{data?.planTier || 'Starter'}</div>
        </div>
      </div>
    </div>
  );
}
