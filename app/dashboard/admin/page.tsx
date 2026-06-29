'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Activity, Users, Database, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Power, TrendingUp,
  Server, CreditCard, BarChart3
} from 'lucide-react';

interface ProviderHealth {
  status: string;
  failures?: number;
  open?: boolean;
}

interface AdminMetrics {
  totalOrganizations?: number;
  totalUsers?: number;
  totalSearches?: number;
  totalCompanies?: number;
  activeCampaigns?: number;
  totalEnrichments?: number;
  totalRevenue?: number;
  providerHealth: Record<string, ProviderHealth>;
  errorsLastHour?: number;
  avgResponseTime?: number;
  activeNow?: number;
}

export default function AdminPortalPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'users' | 'billing'>('overview');
  const [resettingCircuit, setResettingCircuit] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminMetrics();
    const interval = setInterval(fetchAdminMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchAdminMetrics() {
    try {
      const res = await fetch('/api/admin/metrics', { method: 'POST' });
      const data = await res.json();
      const m = data.metrics || data;
      setMetrics({
        totalOrganizations: m.totalOrganizations,
        totalUsers: m.totalUsers,
        totalSearches: m.searchesToday,
        totalCompanies: m.totalEnrichments,
        activeCampaigns: m.activeCampaigns,
        totalEnrichments: m.totalEnrichments,
        totalRevenue: m.totalRevenue,
        providerHealth: {
          google_places: { status: m.google_status || 'unknown' },
          apollo: { status: m.apollo_status || 'unknown' },
          deepseek: { status: m.deepseek_status || 'unknown' },
          campaign: { status: m.campaign_status || 'unknown' },
        },
        errorsLastHour: m.errorsLastHour || 0,
        avgResponseTime: m.avgResponseTime || 0,
        activeNow: m.activeNow || 0,
      });
    } catch {
      console.error('Failed to fetch admin metrics');
    } finally {
      setLoading(false);
    }
  }

  async function resetCircuit(provider: string) {
    setResettingCircuit(provider);
    try {
      const res = await fetch('/api/telemetry-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_circuit', provider }),
      });
      if (!res.ok) {
        console.error('Circuit reset not available on this endpoint');
      }
      fetchAdminMetrics();
    } catch {
      console.error('Failed to reset circuit');
    } finally {
      setResettingCircuit(null);
    }
  }

  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-red" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex w-10 h-10 items-center justify-center rounded-xl bg-red">
            <Shield className="w-5 h-5 text-text" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Admin Portal</h1>
            <p className="text-sm text-muted mt-0.5">System governance and observability</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-green/30 bg-green/10 px-4 py-2">
          <div className="w-2 h-2 animate-pulse rounded-full bg-green" />
          <span className="text-sm text-green">System Online</span>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl border border-border bg-surface2 p-1">
        {(['overview', 'providers', 'users', 'billing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-red text-text'
                : 'text-muted hover:text-text/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <AdminCard icon={<Users className="w-5 h-5" />} label="Organizations" value={metrics?.totalOrganizations ?? '—'} color="blue" />
            <AdminCard icon={<Database className="w-5 h-5" />} label="Companies" value={metrics?.totalCompanies ?? '—'} color="emerald" />
            <AdminCard icon={<Activity className="w-5 h-5" />} label="Searches" value={metrics?.totalSearches ?? '—'} color="amber" />
            <AdminCard icon={<TrendingUp className="w-5 h-5" />} label="Revenue" value={metrics?.totalRevenue ? `$${Number(metrics.totalRevenue).toFixed(2)}` : '—'} color="purple" />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h3 className="mb-4 font-semibold">System Health</h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <HealthMetric label="Avg Response Time" value={metrics?.avgResponseTime ? `${metrics.avgResponseTime}ms` : '—'} status={metrics?.avgResponseTime && metrics.avgResponseTime < 500 ? 'good' : 'warning'} />
              <HealthMetric label="Errors (1h)" value={metrics?.errorsLastHour ?? '—'} status={metrics?.errorsLastHour === 0 ? 'good' : 'warning'} />
              <HealthMetric label="Active Users" value={metrics?.activeNow ?? '—'} status="good" />
              <HealthMetric label="Campaigns" value={metrics?.activeCampaigns ?? '—'} status="good" />
            </div>
          </div>
        </>
      )}

      {activeTab === 'providers' && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="mb-4 font-semibold">Provider Circuit Breakers</h3>
          <div className="space-y-3">
            {metrics?.providerHealth && Object.entries(metrics.providerHealth).map(([name, health]) => (
              <div key={name} className="flex items-center justify-between rounded-xl border border-border/50 bg-surface2 p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    health.status === 'healthy' || health.status === 'HEALTHY' ? 'bg-green' :
                    health.status === 'degraded' || health.status === 'DEGRADED' ? 'bg-yellow' :
                    'bg-red animate-pulse'
                  }`} />
                  <div>
                    <div className="font-medium capitalize">{name.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-muted">
                      {health.failures ?? 0} failures | Circuit {health.open ? 'OPEN' : 'CLOSED'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => resetCircuit(name)}
                  disabled={resettingCircuit === name || !health.open}
                  className="flex items-center gap-2 rounded-lg bg-surface2 border border-border px-4 py-2 text-sm hover:bg-surface2/80 disabled:opacity-30"
                >
                  <Power className="w-4 h-4" />
                  {resettingCircuit === name ? 'Resetting...' : 'Reset'}
                </button>
              </div>
            ))}
            {(!metrics?.providerHealth || Object.keys(metrics.providerHealth).length === 0) && (
              <div className="py-12 text-center text-muted">No provider data available</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="mb-4 font-semibold">User Management</h3>
          <p className="text-sm text-muted">User management interface coming in v1.1. Use Supabase Auth dashboard for now.</p>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h3 className="mb-4 font-semibold">Billing Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <BillingCard label="MRR" value={metrics?.totalRevenue ? `$${Number(metrics.totalRevenue).toFixed(2)}` : '—'} />
            <BillingCard label="Active Subscriptions" value={metrics?.totalOrganizations ?? 0} />
            <BillingCard label="Avg Revenue/Org" value={metrics?.totalOrganizations && metrics.totalRevenue ? `$${(Number(metrics.totalRevenue) / metrics.totalOrganizations).toFixed(2)}` : '—'} />
          </div>
        </div>
      )}
    </div>
  );
}

function AdminCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue/10 text-blue border-blue/20',
    emerald: 'bg-green/10 text-green border-green/20',
    amber: 'bg-yellow/10 text-yellow border-yellow/20',
    purple: 'bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20',
  };

  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]}`}>
      <div className="mb-3 opacity-80">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs opacity-60">{label}</div>
    </div>
  );
}

function HealthMetric({ label, value, status }: { label: string; value: string | number; status: string }) {
  const statusColors = {
    good: 'text-green',
    warning: 'text-yellow',
    critical: 'text-red',
  };

  return (
    <div className="rounded-xl border border-border/50 bg-surface2 p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className={`mt-1 text-xl font-bold ${statusColors[status as keyof typeof statusColors] || 'text-text'}`}>
        {value}
      </div>
    </div>
  );
}

function BillingCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-surface2 p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
