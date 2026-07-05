'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface VerticalConfig {
  id: string;
  slug: string;
  industry_name: string;
  search_queries: string[];
  target_naics_codes: string[];
  equipment_keywords: string[];
  negative_keywords: string[];
  base_scoring_weights: {
    distanceWeight: number;
    contactEnrichmentWeight: number;
    assetSignalWeight: number;
  };
}

interface HealthRow {
  table_name: string;
  row_count: number;
  index_size: string;
  cache_hit_ratio: number;
  rls_enabled: boolean;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  provider: string;
  latency_ms: number;
  is_success: boolean;
  cost_usd: number;
  query_type: string;
}

interface RLSResult {
  organization: string;
  role: string;
  sql: string;
  rows: { id: string; company_name: string; status: string; priority: string }[];
  error?: string;
}

export default function AdminDeck() {
  const [activeTab, setActiveTab] = useState<'overview' | 'verticals' | 'rls' | 'audits'>('overview');
  const [verticals, setVerticals] = useState<VerticalConfig[]>([]);
  const [healthData, setHealthData] = useState<HealthRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingVertical, setEditingVertical] = useState<VerticalConfig | null>(null);
  const [isNewVertical, setIsNewVertical] = useState(false);
  const [verticalForm, setVerticalForm] = useState<VerticalConfig>({
    id: '', slug: '', industry_name: '', search_queries: [], target_naics_codes: [],
    equipment_keywords: [], negative_keywords: [],
    base_scoring_weights: { distanceWeight: 30, contactEnrichmentWeight: 40, assetSignalWeight: 30 },
  });

  const [rlsOrg, setRlsOrg] = useState('org_1');
  const [rlsRole, setRlsRole] = useState<'owner' | 'sales_rep'>('sales_rep');
  const [rlsResult, setRlsResult] = useState<RLSResult | null>(null);
  const [rlsRunning, setRlsRunning] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [vertRes, healthRes, auditRes] = await Promise.allSettled([
          fetch('/api/verticals'),
          fetch('/api/health'),
          fetch('/api/telemetry-management', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'audit-log', limit: 20 }),
          }),
        ]);

        if (vertRes.status === 'fulfilled' && vertRes.value.ok) {
          const d = await vertRes.value.json();
          setVerticals(d.verticals ?? []);
        }

        if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
          const d = await healthRes.value.json();
          setHealthData(d.tables ?? []);
        }

        if (auditRes.status === 'fulfilled' && auditRes.value.ok) {
          const d = await auditRes.value.json();
          setAuditLogs(d.logs ?? []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSaveVertical = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/verticals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNewVertical ? { action: 'create', ...verticalForm } : { action: 'update', ...verticalForm }),
      });
      if (res.ok) {
        const d = await res.json();
        if (isNewVertical) setVerticals([...verticals, d.vertical]);
        else setVerticals(verticals.map(v => v.id === verticalForm.id ? d.vertical : v));
      }
    } catch {}
    setEditingVertical(null);
    setIsNewVertical(false);
  };

  const triggerRLS = async () => {
    setRlsRunning(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rls-test', organization: rlsOrg, role: rlsRole }),
      });
      if (res.ok) {
        setRlsResult(await res.json());
      } else {
        setRlsResult({ organization: rlsOrg, role: rlsRole, sql: '-- error', rows: [], error: 'RLS test failed' });
      }
    } catch {
      setRlsResult({ organization: rlsOrg, role: rlsRole, sql: '-- error', rows: [], error: 'Request failed' });
    } finally {
      setRlsRunning(false);
    }
  };

  const totalCost = auditLogs.reduce((a, l) => a + (l.cost_usd ?? 0), 0);
  const avgLatency = auditLogs.length > 0
    ? Math.round(auditLogs.reduce((a, l) => a + (l.latency_ms ?? 0), 0) / auditLogs.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-slate-400 font-mono text-sm animate-pulse">Loading admin data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-rose-500 selection:text-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-rose-600 text-slate-950 p-1.5 rounded font-black tracking-tighter text-sm flex items-center justify-center">IIE</div>
            <span className="text-xs uppercase font-mono tracking-widest text-rose-500 font-bold">Admin Deck</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Database & System Configuration</h1>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg gap-1">
          {(['overview', 'verticals', 'rls', 'audits'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${
                activeTab === tab ? 'bg-slate-850 border border-slate-700 text-rose-400 shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'overview' ? 'Overview & Telemetry' :
               tab === 'verticals' ? 'Vertical Profiles' :
               tab === 'rls' ? 'RLS Sandbox' : 'Provider Audits'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-rose-950/30 border border-rose-900/50 rounded-xl text-rose-400 text-sm font-mono">
            {error}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur">
                <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Supabase Table Health
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-[10px] font-mono tracking-wider uppercase text-slate-400">
                        <th className="pb-3">Table</th>
                        <th className="pb-3">Rows</th>
                        <th className="pb-3">Index</th>
                        <th className="pb-3">Cache Hit</th>
                        <th className="pb-3 text-right">RLS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-sm font-mono">
                      {healthData.map(t => (
                        <tr key={t.table_name} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 text-slate-200 font-bold">{t.table_name}</td>
                          <td className="py-3 text-rose-400">{t.row_count.toLocaleString()}</td>
                          <td className="py-3 text-slate-400">{t.index_size}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400">{t.cache_hit_ratio}%</span>
                              <div className="w-12 bg-slate-850 h-1.5 rounded overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{ width: `${t.cache_hit_ratio}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                              {t.rls_enabled ? 'RLS On' : 'RLS Off'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400 font-bold mb-4">API Cost Telemetry</h2>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Displayed API Spend</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-mono font-extrabold text-rose-500">${totalCost.toFixed(3)}</span>
                      <span className="text-[10px] font-mono text-slate-500">USD</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Avg Latency</span>
                    <span className="text-xl font-mono text-slate-200 font-bold">{avgLatency} ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verticals' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Vertical Config Database</h2>
                <button onClick={() => { setIsNewVertical(true); setEditingVertical({ id: '', slug: '', industry_name: '', search_queries: [''], target_naics_codes: [''], equipment_keywords: [''], negative_keywords: [''], base_scoring_weights: { distanceWeight: 30, contactEnrichmentWeight: 40, assetSignalWeight: 30 } }); setVerticalForm({ id: '', slug: '', industry_name: '', search_queries: [''], target_naics_codes: [''], equipment_keywords: [''], negative_keywords: [''], base_scoring_weights: { distanceWeight: 30, contactEnrichmentWeight: 40, assetSignalWeight: 30 } }); }}
                  className="bg-rose-600 hover:bg-rose-700 text-slate-950 text-xs font-bold px-3 py-1.5 rounded transition-all">
                  + Add Profile
                </button>
              </div>
              {verticals.map(v => (
                <div key={v.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-extrabold text-base">{v.industry_name}</span>
                      <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 text-[10px] text-slate-400 font-mono rounded">slug: {v.slug}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">NAICS: {v.target_naics_codes.join(', ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingVertical(v); setVerticalForm({ ...v }); }} className="text-xs bg-slate-850 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded font-bold text-slate-200">
                      Configure
                    </button>
                    <button onClick={() => fetch('/api/verticals', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: v.id }) }).then(() => setVerticals(verticals.filter(x => x.id !== v.id)))} className="text-xs bg-rose-950/20 hover:bg-rose-950/45 border border-rose-900/30 text-rose-400 px-3 py-1.5 rounded font-bold">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              {editingVertical && (
                <form onSubmit={handleSaveVertical} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-sm font-bold text-rose-400 font-mono">{isNewVertical ? 'CREATE VERTICAL' : 'EDIT VERTICAL'}</span>
                    <button type="button" onClick={() => { setEditingVertical(null); setIsNewVertical(false); }} className="text-slate-500 hover:text-slate-300 text-xs font-bold">Cancel</button>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Name</label>
                      <input type="text" required value={verticalForm.industry_name} onChange={e => setVerticalForm({ ...verticalForm, industry_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 font-mono" />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Slug</label>
                      <input type="text" required value={verticalForm.slug} onChange={e => setVerticalForm({ ...verticalForm, slug: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 font-mono" />
                    </div>
                    <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-slate-950 text-xs font-extrabold py-2 rounded mt-4 uppercase font-mono">
                      {isNewVertical ? 'Create' : 'Update'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rls' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-xl space-y-4">
              <h2 className="text-md font-extrabold font-mono text-rose-400">RLS Context Tester</h2>
              <p className="text-xs text-slate-400 font-mono">Test Row-Level Security isolation for a given org and role.</p>
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Organization</label>
                  <select value={rlsOrg} onChange={e => setRlsOrg(e.target.value)} className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200">
                    <option value="org_1">Tenant A</option>
                    <option value="org_2">Tenant B</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  {(['owner', 'sales_rep'] as const).map(r => (
                    <button key={r} onClick={() => setRlsRole(r)}
                      className={`flex-1 py-1.5 rounded font-bold border transition-all ${rlsRole === r ? 'bg-indigo-950/40 text-indigo-300 border-indigo-700/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                      {r === 'owner' ? 'Owner' : 'Sales Rep'}
                    </button>
                  ))}
                </div>
                <button onClick={triggerRLS} disabled={rlsRunning}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-slate-950 font-extrabold py-2 rounded mt-2 uppercase font-mono disabled:opacity-55">
                  {rlsRunning ? 'Testing...' : 'Test Isolation'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-xl">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                  <span className="text-xs font-mono text-slate-400">RLS Test Result</span>
                  <span className={`h-2.5 w-2.5 rounded-full ${rlsRunning ? 'bg-amber-500 animate-pulse' : rlsResult?.error ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                </div>
                {rlsResult ? (
                  <div className="space-y-4">
                    {rlsResult.error && (
                      <div className="bg-rose-950/30 border border-rose-900/50 rounded-lg p-3 text-rose-400 text-xs font-mono">{rlsResult.error}</div>
                    )}
                    <pre className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-rose-400 overflow-x-auto border border-slate-850">
                      {rlsResult.sql}
                    </pre>
                    {rlsResult.rows.length > 0 && (
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-2">Company</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Priority</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850/60">
                          {rlsResult.rows.map((r, i) => (
                            <tr key={i} className="text-slate-300">
                              <td className="py-2">{r.company_name}</td>
                              <td className="py-2">{r.status}</td>
                              <td className="py-2 text-right">{r.priority}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 text-xs font-mono py-8 text-center">
                    Select an org and role, then run the test.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audits' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold">API Provider Audit Log</h2>
                <p className="text-xs text-slate-400 font-mono">Last 20 provider interactions</p>
              </div>
              <div className="flex gap-4 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-850">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Avg Latency</span>
                  <span className="text-emerald-400 font-bold">{avgLatency}ms</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-500 block uppercase text-[10px]">Total Cost</span>
                  <span className="text-rose-400 font-bold">${totalCost.toFixed(3)}</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] font-mono tracking-wider uppercase text-slate-400">
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Provider</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3 text-right">Latency</th>
                    <th className="pb-3 text-right">Cost</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-xs font-mono">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 text-slate-400">{log.timestamp}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          log.provider === 'google' ? 'bg-blue-950/45 text-blue-300 border border-blue-900/35' :
                          log.provider === 'apollo' ? 'bg-indigo-950/45 text-indigo-300 border border-indigo-900/35' :
                          'bg-amber-950/45 text-amber-300 border border-amber-900/35'
                        }`}>
                          {log.provider}
                        </span>
                      </td>
                      <td className="py-3 text-slate-200">{log.query_type}</td>
                      <td className="py-3 text-right text-slate-300">{log.latency_ms}ms</td>
                      <td className="py-3 text-right text-slate-300">{log.cost_usd > 0 ? `$${log.cost_usd.toFixed(3)}` : '—'}</td>
                      <td className="py-3 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${log.is_success ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/30' : 'text-rose-400 bg-rose-950/30 border border-rose-900/30'}`}>
                          {log.is_success ? 'OK' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
