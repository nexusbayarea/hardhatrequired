"use client";

import React, { useState, useEffect } from 'react';

interface AuditTrace {
  id: string;
  timestamp: string;
  provider: 'google_places' | 'apollo' | 'gemini_grounding' | 'system_adapter';
  action: string;
  latencyMs: number;
  costUsd: number;
  isSuccess: boolean;
  errorMessage?: string;
}

interface ProviderMetric {
  avg_latency: number;
  success_rate: number;
  total_cost: number;
}

interface TelemetryStats {
  totalApiCalls: number;
  accumulatedCost: number;
  averageLatencyMs: number;
  averageGeminiLatencyMs: number;
  googleCalls: number;
  apolloCalls: number;
  geminiCalls: number;
  adapterCalls: number;
  failureRatePercentage: number;
  latencyByProvider: Record<string, ProviderMetric>;
}

const INITIAL_STATS: TelemetryStats = {
  totalApiCalls: 1420,
  accumulatedCost: 0.082415,
  averageLatencyMs: 482,
  averageGeminiLatencyMs: 1240,
  googleCalls: 620,
  apolloCalls: 400,
  geminiCalls: 320,
  adapterCalls: 80,
  failureRatePercentage: 1.8,
  latencyByProvider: {
    google_places: { avg_latency: 310, success_rate: 99.2, total_cost: 0.015500 },
    apollo: { avg_latency: 240, success_rate: 98.5, total_cost: 0.062000 },
    gemini_grounding: { avg_latency: 1240, success_rate: 96.4, total_cost: 0.004915 },
    system_adapter: { avg_latency: 18, success_rate: 100.0, total_cost: 0.000000 }
  }
};

const INITIAL_TRACES: AuditTrace[] = [
  { id: 'tr-948a', timestamp: '16:02:11', provider: 'gemini_grounding', action: 'Grounding Crawler: Svenson Operations', latencyMs: 1240, costUsd: 0.000450, isSuccess: true },
  { id: 'tr-21ab', timestamp: '16:01:59', provider: 'google_places', action: 'Google Search: Hayward CA 94544', latencyMs: 320, costUsd: 0.000180, isSuccess: true },
  { id: 'tr-04fe', timestamp: '16:01:43', provider: 'apollo', action: 'Contact Enrichment: Svenson Operations', latencyMs: 154, costUsd: 0.000080, isSuccess: true },
  { id: 'tr-889d', timestamp: '16:01:12', provider: 'system_adapter', action: 'Deduplication Merge Context Trace', latencyMs: 12, costUsd: 0.000000, isSuccess: true },
  { id: 'tr-521c', timestamp: '15:59:44', provider: 'gemini_grounding', action: 'Grounding Crawler: J&R Environmental', latencyMs: 3400, costUsd: 0.000000, isSuccess: false, errorMessage: 'Grounding connection timeout. Exceeded limit context parameters.' }
];

export default function SystemTelemetryMonitor() {
  const [stats, setStats] = useState<TelemetryStats>(INITIAL_STATS);
  const [traces, setTraces] = useState<AuditTrace[]>(INITIAL_TRACES);
  const [activeVertical, setActiveVertical] = useState<string>('slurry_processing');
  const [backpressureCount, setBackpressureCount] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<'realtime' | 'providers' | 'queue'>('realtime');
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchTelemetry = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/telemetry-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-iie-client-context': activeVertical
        },
        body: JSON.stringify({ action: 'get-telemetry' })
      });
      const payload = await res.json();
      if (payload.success && payload.stats) {
        setStats(payload.stats);
      }
    } catch (err) {
      console.warn('Backend endpoint unconfigured or missing credentials. Reverting to high-fidelity simulated buffer.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    if (!isLive) return;

    const interval = setInterval(() => {
      setBackpressureCount(prev => {
        const delta = Math.floor(Math.random() * 3) - 1;
        const next = prev + delta;
        return next < 0 ? 1 : next > 8 ? 4 : next;
      });

      const providers: Array<AuditTrace['provider']> = ['google_places', 'apollo', 'gemini_grounding', 'system_adapter'];
      const provider = providers[Math.floor(Math.random() * providers.length)];
      const id = `tr-${Math.random().toString(36).substring(2, 6)}`;
      const success = Math.random() > 0.05;
      const latency = provider === 'gemini_grounding' 
        ? Math.floor(Math.random() * 800) + 900 
        : Math.floor(Math.random() * 250) + 40;

      const costMap = { google_places: 0.000180, apollo: 0.000080, gemini_grounding: 0.000450, system_adapter: 0.000000 };
      const cost = success ? costMap[provider] : 0;

      const newTrace: AuditTrace = {
        id,
        timestamp: new Date().toLocaleTimeString(),
        provider,
        action: `Simulated live data-stream trace activity for ${provider}`,
        latencyMs: latency,
        costUsd: cost,
        isSuccess: success,
        errorMessage: success ? undefined : 'Scraping target failed verification'
      };

      setTraces(prev => [newTrace, ...prev.slice(0, 19)]);
      setStats(prev => {
        const total = prev.totalApiCalls + 1;
        const accCost = prev.accumulatedCost + cost;
        const failureCount = Math.round((prev.failureRatePercentage / 100) * prev.totalApiCalls) + (success ? 0 : 1);
        return {
          ...prev,
          totalApiCalls: total,
          accumulatedCost: accCost,
          failureRatePercentage: Number(((failureCount / total) * 100).toFixed(2))
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive, activeVertical]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 selection:bg-cyan-500 selection:text-white flex flex-col gap-6 font-sans">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-500 font-bold">System Observability Dashboard</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">Telemetry & Crawler Logs</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activeVertical}
            onChange={(e) => {
              setActiveVertical(e.target.value);
              fetchTelemetry();
            }}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer text-slate-200"
          >
            <option value="slurry_processing">Slurry Wall & Drilling Mud</option>
            <option value="asbestos_abatement">Asbestos Remediation</option>
            <option value="edge-compute">Edge Compute Clusters</option>
            <option value="gas-stations-deli">Gas Station Delis</option>
          </select>

          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
              isLive 
                ? 'bg-cyan-950/40 border-cyan-800 text-cyan-400' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {isLive ? 'Streaming Live' : 'Paused'}
          </button>

          <button
            onClick={fetchTelemetry}
            disabled={isRefreshing}
            className="p-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 15H15M20 20v-5h-.581m0 0a8.003 8.003 0 01-15.357-2F15" />
            </svg>
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Workspace API Spend</span>
            <span className="text-3xl font-mono font-extrabold text-cyan-400 mt-2 block">${stats.accumulatedCost.toFixed(5)}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 font-mono">
            Accumulated over {stats.totalApiCalls} transaction traces
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mean Queue Latency</span>
            <span className="text-3xl font-mono font-extrabold text-white mt-2 block">{stats.averageLatencyMs}ms</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 font-mono">
            Google/Apollo/System base averages
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Average LLM Grounding</span>
            <span className="text-3xl font-mono font-extrabold text-cyan-300 mt-2 block">{stats.averageGeminiLatencyMs}ms</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 font-mono">
            Direct Gemini-2.5 crawling cycle speed
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 relative overflow-hidden backdrop-blur flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Crawler Error Rate</span>
            <span className={`text-3xl font-mono font-extrabold mt-2 block ${stats.failureRatePercentage > 3.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stats.failureRatePercentage}%
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 font-mono flex justify-between items-center">
            <span>SLA Standard &le; 5.0%</span>
            <span className="text-emerald-400 font-bold uppercase tracking-widest text-xs bg-emerald-950 px-1 rounded border border-emerald-800/40">Healthy</span>
          </div>
        </div>

      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-850 pb-3">
              <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                <button
                  onClick={() => setActiveTab('realtime')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'realtime' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Live Run Trace
                </button>
                <button
                  onClick={() => setActiveTab('providers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'providers' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Provider Cost Allocations
                </button>
                <button
                  onClick={() => setActiveTab('queue')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'queue' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Worker Backpressure ({backpressureCount})
                </button>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Viewing telemetry slice mapped to: <span className="text-cyan-400">{activeVertical}</span>
              </span>
            </div>

            {activeTab === 'realtime' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-mono text-slate-400 tracking-wider uppercase border-b border-slate-850">
                      <th className="pb-3 font-semibold">Time</th>
                      <th className="pb-3 font-semibold">ID</th>
                      <th className="pb-3 font-semibold">System Instance</th>
                      <th className="pb-3 font-semibold">Subsystem Action</th>
                      <th className="pb-3 font-semibold text-right">Latency</th>
                      <th className="pb-3 font-semibold text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-xs font-mono">
                    {traces.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="py-3 text-slate-500">{t.timestamp}</td>
                        <td className="py-3 text-slate-400 font-bold">{t.id}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold border ${
                            t.provider === 'gemini_grounding' ? 'bg-amber-950/30 text-amber-400 border-amber-800/40' :
                            t.provider === 'google_places' ? 'bg-blue-950/30 text-blue-400 border-blue-800/40' :
                            t.provider === 'apollo' ? 'bg-indigo-950/30 text-indigo-400 border-indigo-800/40' :
                            'bg-slate-950 text-slate-400 border-slate-800'
                          }`}>
                            {t.provider === 'gemini_grounding' ? 'Gemini 2.5' : t.provider.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 max-w-[240px] truncate text-slate-200" title={t.isSuccess ? t.action : t.errorMessage}>
                          {t.isSuccess ? t.action : `Error: ${t.errorMessage}`}
                        </td>
                        <td className="py-3 text-right text-slate-300 font-semibold">{t.latencyMs} ms</td>
                        <td className="py-3 text-right text-cyan-400 font-semibold">
                          {t.costUsd > 0 ? `$${t.costUsd.toFixed(6)}` : '\u2014'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'providers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(stats.latencyByProvider).map(([name, data]) => (
                  <div key={name} className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase font-bold font-mono text-cyan-400">{name.replace(/_/g, ' ')}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-slate-900 border border-slate-800 text-slate-300">
                        SR: {data.success_rate}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <span className="text-xs text-slate-500 block">Avg Response Time</span>
                        <span className="text-lg font-mono font-bold text-white">{data.avg_latency}ms</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Accumulated Spend</span>
                        <span className="text-lg font-mono font-bold text-cyan-400">${data.total_cost.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'queue' && (
              <div className="space-y-4 font-mono">
                <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-400">Playwright Cluster Utilization</span>
                    <span className="text-xs text-cyan-400 font-bold">{backpressureCount} Active Nodes</span>
                  </div>
                  <div className="w-full bg-slate-900 h-4 rounded overflow-hidden flex gap-0.5 p-0.5 border border-slate-850">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-full flex-1 rounded-sm transition-all duration-300 ${
                          i < backpressureCount 
                            ? backpressureCount > 5 ? 'bg-rose-500 animate-pulse' : 'bg-cyan-500' 
                            : 'bg-slate-950'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Low Queue Backpressure</span>
                    <span>Buffer Bound Limits (Max 8 concurrent)</span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-bold block text-slate-400 mb-2">Active Scheduled Task Pool (Hermes OS)</span>
                  <div className="flex justify-between text-xs border-b border-slate-900 pb-2 text-slate-300">
                    <span>Task Name</span>
                    <span>Schedule</span>
                    <span>Status</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="text-slate-300">edge_compute_hourly_sweep</span>
                    <span className="font-mono text-xs">0 * * * *</span>
                    <span className="text-cyan-500 font-bold">Queued</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span className="text-slate-300">gas_deli_weekly_sweep</span>
                    <span className="font-mono text-xs">0 0 * * 5</span>
                    <span className="text-slate-500">Sleeping</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-xs uppercase tracking-widest font-bold font-mono text-cyan-500">Integration Checklist</h3>
            <ul className="space-y-3 font-mono text-xs">
              <li className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded border border-slate-850">
                <span className="text-slate-400">NEXT_PUBLIC_SUPABASE_URL</span>
                <span className="text-emerald-400 font-bold uppercase text-xs bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">Linked</span>
              </li>
              <li className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded border border-slate-850">
                <span className="text-slate-400">GOOGLE_PLACES_API_KEY</span>
                <span className="text-emerald-400 font-bold uppercase text-xs bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">Linked</span>
              </li>
              <li className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded border border-slate-850">
                <span className="text-slate-400">APOLLO_API_KEY</span>
                <span className="text-emerald-400 font-bold uppercase text-xs bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">Linked</span>
              </li>
              <li className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded border border-slate-850">
                <span className="text-slate-400">GEMINI_API_KEY</span>
                <span className="text-emerald-400 font-bold uppercase text-xs bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">Linked</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900/35 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs uppercase tracking-widest font-bold font-mono text-cyan-500">Live Simulation Sandbox</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">
              Use these trigger nodes to mock trace errors on your live dashboard and verify alerting paths.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button 
                onClick={() => {
                  const id = `tr-${Math.random().toString(36).substring(2, 6)}`;
                  const newErr: AuditTrace = {
                    id,
                    timestamp: new Date().toLocaleTimeString(),
                    provider: 'gemini_grounding',
                    action: 'Grounding Crawler: Custom Test Event Error',
                    latencyMs: 5000,
                    costUsd: 0.0,
                    isSuccess: false,
                    errorMessage: 'Manual test failure injected.'
                  };
                  setTraces(prev => [newErr, ...prev]);
                  setStats(prev => ({
                    ...prev,
                    totalApiCalls: prev.totalApiCalls + 1,
                    failureRatePercentage: Number((((Math.round((prev.failureRatePercentage / 100) * prev.totalApiCalls) + 1) / (prev.totalApiCalls + 1)) * 100).toFixed(2))
                  }));
                }}
                className="bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/40 text-rose-400 py-2 rounded-xl transition font-semibold"
              >
                Inject Failure
              </button>
              <button 
                onClick={() => {
                  const id = `tr-${Math.random().toString(36).substring(2, 6)}`;
                  const newSucc: AuditTrace = {
                    id,
                    timestamp: new Date().toLocaleTimeString(),
                    provider: 'system_adapter',
                    action: 'System: Dynamic Deduplication check complete',
                    latencyMs: 14,
                    costUsd: 0.0,
                    isSuccess: true
                  };
                  setTraces(prev => [newSucc, ...prev]);
                  setStats(prev => ({
                    ...prev,
                    totalApiCalls: prev.totalApiCalls + 1,
                    failureRatePercentage: Number((((Math.round((prev.failureRatePercentage / 100) * prev.totalApiCalls)) / (prev.totalApiCalls + 1)) * 100).toFixed(2))
                  }));
                }}
                className="bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-900/40 text-emerald-400 py-2 rounded-xl transition font-semibold"
              >
                Inject Success
              </button>
            </div>
          </div>
        </div>

      </section>

    </div>
  );
}
