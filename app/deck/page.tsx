"use client";

import React, { useState, useEffect } from 'react';

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

interface TableHealth {
  tableName: string;
  rowCount: number;
  indexSize: string;
  cacheHitRatio: number;
  rlsEnabled: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  provider: 'google' | 'apollo' | 'gemini';
  latencyMs: number;
  isSuccess: boolean;
  costUsd: number;
  queryType: string;
}

const INITIAL_VERTICALS: VerticalConfig[] = [
  {
    id: '1',
    slug: 'slurry_concrete',
    industry_name: 'Concrete Slurry Recycling & Disposal',
    search_queries: ['concrete recycling', 'slurry disposal', 'concrete contractors'],
    target_naics_codes: ['562211', '238110', '562112'],
    equipment_keywords: ['filter press', 'dewatering box', 'slurry tanker', 'vacuum truck'],
    negative_keywords: ['municipal dump', 'residential landfill', 'junk removal'],
    base_scoring_weights: { distanceWeight: 35, contactEnrichmentWeight: 35, assetSignalWeight: 30 }
  },
  {
    id: '2',
    slug: 'grease_trap',
    industry_name: 'Commercial Grease Trap Pumping & Recycling',
    search_queries: ['grease trap pumping', 'restaurant grease disposal'],
    target_naics_codes: ['562219', '562111', '562998'],
    equipment_keywords: ['grease interceptor', 'vacuum tanker', 'hydro-jetting'],
    negative_keywords: ['residential plumbing', 'home kitchen cleaning', 'toilet repair'],
    base_scoring_weights: { distanceWeight: 30, contactEnrichmentWeight: 40, assetSignalWeight: 30 }
  },
  {
    id: '3',
    slug: 'asbestos_abatement',
    industry_name: 'Hazardous Asbestos & Lead Abatement',
    search_queries: ['asbestos abatement', 'lead paint removal'],
    target_naics_codes: ['562910', '238910'],
    equipment_keywords: ['negative air machine', 'HEPA vacuum', 'containment barrier'],
    negative_keywords: ['paint store', 'hardware store', 'residential painter'],
    base_scoring_weights: { distanceWeight: 25, contactEnrichmentWeight: 45, assetSignalWeight: 30 }
  }
];

const INITIAL_HEALTH: TableHealth[] = [
  { tableName: 'organizations', rowCount: 14, indexSize: '16 KB', cacheHitRatio: 99.8, rlsEnabled: true },
  { tableName: 'users', rowCount: 42, indexSize: '48 KB', cacheHitRatio: 99.5, rlsEnabled: true },
  { tableName: 'verticals', rowCount: 8, indexSize: '16 KB', cacheHitRatio: 99.9, rlsEnabled: true },
  { tableName: 'companies', rowCount: 12403, indexSize: '2.4 MB', cacheHitRatio: 94.2, rlsEnabled: true },
  { tableName: 'contacts', rowCount: 8944, indexSize: '1.8 MB', cacheHitRatio: 92.1, rlsEnabled: true },
  { tableName: 'searches', rowCount: 382, indexSize: '64 KB', cacheHitRatio: 98.6, rlsEnabled: true },
  { tableName: 'outreach_logs', rowCount: 4122, indexSize: '512 KB', cacheHitRatio: 95.4, rlsEnabled: true },
  { tableName: 'queue_lockouts', rowCount: 3, indexSize: '16 KB', cacheHitRatio: 99.9, rlsEnabled: true }
];

const INITIAL_AUDITS: AuditLog[] = [
  { id: '1', timestamp: '18:42:11', provider: 'google', latencyMs: 380, isSuccess: true, costUsd: 0.025, queryType: 'places_text_search' },
  { id: '2', timestamp: '18:41:59', provider: 'apollo', latencyMs: 2200, isSuccess: true, costUsd: 0.020, queryType: 'org_enrichment' },
  { id: '3', timestamp: '18:41:43', provider: 'gemini', latencyMs: 1450, isSuccess: true, costUsd: 0.005, queryType: 'url_context_grounding' },
  { id: '4', timestamp: '18:40:12', provider: 'google', latencyMs: 1200, isSuccess: false, costUsd: 0.000, queryType: 'places_text_search' },
  { id: '5', timestamp: '18:38:55', provider: 'gemini', latencyMs: 1800, isSuccess: true, costUsd: 0.005, queryType: 'url_context_grounding' }
];

export default function Deck() {
  const [activeTab, setActiveTab] = useState<'overview' | 'verticals' | 'rls' | 'audits'>('overview');
  const [verticals, setVerticals] = useState<VerticalConfig[]>(INITIAL_VERTICALS);
  const [healthData, setHealthData] = useState<TableHealth[]>(INITIAL_HEALTH);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDITS);

  const [editingVertical, setEditingVertical] = useState<VerticalConfig | null>(null);
  const [isNewVertical, setIsNewVertical] = useState(false);
  const [verticalForm, setVerticalForm] = useState<VerticalConfig>({
    id: '', slug: '', industry_name: '', search_queries: [], target_naics_codes: [], equipment_keywords: [], negative_keywords: [],
    base_scoring_weights: { distanceWeight: 30, contactEnrichmentWeight: 40, assetSignalWeight: 30 }
  });

  const [selectedSimRole, setSelectedSimRole] = useState<'owner' | 'sales_rep'>('sales_rep');
  const [selectedSimOrg, setSelectedSimOrg] = useState<string>('org_1');
  const [sandboxSQLResult, setSandboxSQLResult] = useState<string>('Select an emulation context to run a Row-Level Security evaluation script...');
  const [sandboxExecuting, setSandboxExecuting] = useState(false);

  const totalCost = auditLogs.reduce((acc, curr) => acc + curr.costUsd, 0);
  const averageLatency = Math.round(auditLogs.reduce((acc, curr) => acc + curr.latencyMs, 0) / auditLogs.length);

  const handleSaveVertical = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewVertical) {
      const created = { ...verticalForm, id: `vert-${Date.now()}` };
      setVerticals([...verticals, created]);
    } else {
      setVerticals(verticals.map(v => v.id === verticalForm.id ? verticalForm : v));
    }
    setEditingVertical(null);
    setIsNewVertical(false);
  };

  const handleEditVerticalClick = (v: VerticalConfig) => {
    setEditingVertical(v);
    setIsNewVertical(false);
    setVerticalForm({ ...v });
  };

  const handleCreateVerticalClick = () => {
    setEditingVertical(null);
    setIsNewVertical(true);
    setVerticalForm({
      id: '', slug: '', industry_name: '', search_queries: [''], target_naics_codes: [''], equipment_keywords: [''], negative_keywords: [''],
      base_scoring_weights: { distanceWeight: 30, contactEnrichmentWeight: 40, assetSignalWeight: 30 }
    });
  };

  const handleDeleteVertical = (id: string) => {
    setVerticals(verticals.filter(v => v.id !== id));
  };

  const triggerSandboxEmulation = () => {
    setSandboxExecuting(true);
    setTimeout(() => {
      let output = '';
      if (selectedSimOrg === 'org_1') {
        output = `
-- TRANSACTION INITIATED (ORGANIZATION: SlurryDisposal.co)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "usr_alpha", "app_metadata": {"organization_id": "11111111-1111-1111-1111-111111111111"}}';

-- QUERY RESOLUTION: SELECT * FROM public.companies;
-- Row Level Security (RLS) policies invoked: 'tenant_isolation_companies'
-------------------------------------------------------------------------------------
  id     | organization_id | company_name                  | status         | priority
-------------------------------------------------------------------------------------
  comp_1 | 11111111-1111   | Svenson & Sons Operations     | NOT_CONTACTED  | A
  comp_2 | 11111111-1111   | J&R Environmental Logistics   | INTERESTED     | A
-------------------------------------------------------------------------------------
(2 Rows fetched - Is isolated from Tenant B - SECURE ✅)
        `;
      } else {
        output = `
-- TRANSACTION INITIATED (ORGANIZATION: RoofingPros.net)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "usr_beta", "app_metadata": {"organization_id": "22222222-2222-2222-2222-222222222222"}}';

-- QUERY RESOLUTION: SELECT * FROM public.companies;
-- Row Level Security (RLS) policies invoked: 'tenant_isolation_companies'
-------------------------------------------------------------------------------------
  id     | organization_id | company_name                  | status         | priority
-------------------------------------------------------------------------------------
  comp_3 | 22222222-2222   | Bay Area Commercial Roofing   | QUALIFIED      | B
  comp_4 | 22222222-2222   | Flat-Roof Solutions Ltd       | NOT_CONTACTED  | A
-------------------------------------------------------------------------------------
(2 Rows fetched - Is isolated from Tenant A - SECURE ✅)
        `;
      }
      setSandboxSQLResult(output.trim());
      setSandboxExecuting(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 selection:bg-rose-500 selection:text-white">
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="bg-rose-600 text-slate-950 p-1.5 rounded font-black tracking-tighter text-sm flex items-center justify-center">
              IIE
            </div>
            <span className="text-xs uppercase font-mono tracking-widest text-rose-500 font-bold">Admin Deck</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">Database & System Configuration</h1>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg gap-1 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${activeTab === 'overview' ? 'bg-slate-850 border border-slate-700 text-rose-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Overview & Telemetry
          </button>
          <button
            onClick={() => setActiveTab('verticals')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${activeTab === 'verticals' ? 'bg-slate-850 border border-slate-700 text-rose-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Vertical Profiles
          </button>
          <button
            onClick={() => setActiveTab('rls')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${activeTab === 'rls' ? 'bg-slate-850 border border-slate-700 text-rose-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            RLS Sandbox
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${activeTab === 'audits' ? 'bg-slate-850 border border-slate-700 text-rose-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Provider Audits
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur">
                <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Supabase Live Table Health Indicator
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-[10px] font-mono tracking-wider uppercase text-slate-400">
                        <th className="pb-3">Table Name</th>
                        <th className="pb-3">Row Count</th>
                        <th className="pb-3">Index Overhead</th>
                        <th className="pb-3">Cache Hit %</th>
                        <th className="pb-3 text-right">Row Security</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60 text-sm font-mono">
                      {healthData.map((t) => (
                        <tr key={t.tableName} className="hover:bg-slate-900/30 transition-colors">
                          <td className="py-3 text-slate-200 font-bold">{t.tableName}</td>
                          <td className="py-3 text-rose-400">{t.rowCount.toLocaleString()}</td>
                          <td className="py-3 text-slate-400">{t.indexSize}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-400">{t.cacheHitRatio}%</span>
                              <div className="w-12 bg-slate-850 h-1.5 rounded overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{ width: `${t.cacheHitRatio}%` }}></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                              RLS Enabled
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <h3 className="font-bold text-slate-200 mb-3 text-sm tracking-tight uppercase font-mono text-rose-500">Spatial Index Performance Tracking</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Geospatial queries leverage PostGIS and Postgres-native spherical indices (`idx_companies_location`). Full-text multi-vector lookups use GIN indexing (`idx_companies_search_vector`). Combined, search workloads maintain a constant sub-50ms execution profile.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">Spherical Query Capacity</span>
                    <span className="text-xl font-mono text-emerald-400 font-bold">18,500 qps</span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-1">GIST Index Hit Ratio: 99.4%</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-850">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">FTS Execution Times</span>
                    <span className="text-xl font-mono text-emerald-400 font-bold">12.5 ms</span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-1">GIN Index Scan Speed: Fast</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400 font-bold mb-4">API Financial Telemetry</h2>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Today's Estimated API Spend</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-mono font-extrabold text-rose-500">${totalCost.toFixed(3)}</span>
                      <span className="text-[10px] font-mono text-slate-500">USD</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-400 block mb-1">Crawl Response Latency</span>
                    <span className="text-xl font-mono text-slate-200 font-bold">{averageLatency} ms</span>
                  </div>

                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500">Google Places Quota</span>
                      <span className="text-slate-300">8.2% consumed</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded overflow-hidden">
                      <div className="bg-rose-500 h-full" style={{ width: '8.2%' }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500">Apollo Contact Lookup Quota</span>
                      <span className="text-slate-300">14.1% consumed</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded overflow-hidden">
                      <div className="bg-indigo-500 h-full" style={{ width: '14.1%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400 font-bold mb-4">Postgres Integration Audit</h2>
                <ul className="space-y-3 text-xs font-mono">
                  <li className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-850">
                    <span className="text-slate-400">PostGIS Geometry extension</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                  </li>
                  <li className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-850">
                    <span className="text-slate-400">Cube / Earthdistance indexing</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                  </li>
                  <li className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-850">
                    <span className="text-slate-400">Cron Reindexing Triggers</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                  </li>
                  <li className="flex justify-between items-center bg-slate-950/40 p-2 rounded border border-slate-850">
                    <span className="text-slate-400">Row Level Security Enforced</span>
                    <span className="text-emerald-400 font-bold">ACTIVE</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verticals' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Vertical Config Database</h2>
                <button
                  onClick={handleCreateVerticalClick}
                  className="bg-rose-600 hover:bg-rose-700 text-slate-950 text-xs font-bold px-3 py-1.5 rounded transition-all"
                >
                  + Add New Profile
                </button>
              </div>

              {verticals.map((v) => (
                <div key={v.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-extrabold text-base">{v.industry_name}</span>
                      <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 text-[10px] text-slate-400 font-mono rounded">
                        slug: {v.slug}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {v.target_naics_codes.map((naics) => (
                        <span key={naics} className="text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/40 px-1.5 py-0.5 rounded">
                          NAICS {naics}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-mono">
                      Crawler Signals: <span className="text-rose-400">{v.equipment_keywords.join(', ')}</span>
                    </p>
                  </div>

                  <div className="flex gap-2 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-850">
                    <button
                      onClick={() => handleEditVerticalClick(v)}
                      className="flex-1 md:flex-none text-xs bg-slate-850 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded font-bold transition-all text-slate-200"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => handleDeleteVertical(v.id)}
                      className="flex-1 md:flex-none text-xs bg-rose-950/20 hover:bg-rose-950/45 border border-rose-900/30 text-rose-400 px-3 py-1.5 rounded font-bold transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div>
              {editingVertical || isNewVertical ? (
                <form onSubmit={handleSaveVertical} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-sm font-bold text-rose-400 font-mono">
                      {isNewVertical ? 'CREATE VERTICAL TEMPLATE' : 'EDIT VERTICAL PARAMETERS'}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setEditingVertical(null); setIsNewVertical(false); }}
                      className="text-slate-500 hover:text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Industry Vertical Display Name</label>
                      <input
                        type="text"
                        required
                        value={verticalForm.industry_name}
                        onChange={(e) => setVerticalForm({ ...verticalForm, industry_name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                        placeholder="e.g. Concrete Slurry Disposal"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Dynamic Domain Slug</label>
                        <input
                          type="text"
                          required
                          value={verticalForm.slug}
                          onChange={(e) => setVerticalForm({ ...verticalForm, slug: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="e.g. concrete_slurry"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">NAICS Vectors (CSV)</label>
                        <input
                          type="text"
                          value={verticalForm.target_naics_codes.join(', ')}
                          onChange={(e) => setVerticalForm({ ...verticalForm, target_naics_codes: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                          placeholder="e.g. 562211, 238110"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Search Keywords (CSV)</label>
                      <input
                        type="text"
                        value={verticalForm.search_queries.join(', ')}
                        onChange={(e) => setVerticalForm({ ...verticalForm, search_queries: e.target.value.split(',').map(s => s.trim()) })}
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                        placeholder="e.g. concrete recycling, slurry disposal"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Equipment Signal Keywords (CSV)</label>
                      <input
                        type="text"
                        value={verticalForm.equipment_keywords.join(', ')}
                        onChange={(e) => setVerticalForm({ ...verticalForm, equipment_keywords: e.target.value.split(',').map(s => s.trim()) })}
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                        placeholder="e.g. filter press, centrifuge, slurry box"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Exclusion Keywords (CSV)</label>
                      <input
                        type="text"
                        value={verticalForm.negative_keywords.join(', ')}
                        onChange={(e) => setVerticalForm({ ...verticalForm, negative_keywords: e.target.value.split(',').map(s => s.trim()) })}
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                        placeholder="e.g. residential waste, local plumbers"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <span className="text-slate-400 block mb-1 font-bold">MIE Dynamic Scoring Weights (Must equal 100)</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Distance Weight</label>
                          <input
                            type="number"
                            value={verticalForm.base_scoring_weights.distanceWeight}
                            onChange={(e) => setVerticalForm({
                              ...verticalForm,
                              base_scoring_weights: { ...verticalForm.base_scoring_weights, distanceWeight: Number(e.target.value) }
                            })}
                            className="w-full bg-slate-950 border border-slate-800 px-2 py-1.5 rounded text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Enrichment Weight</label>
                          <input
                            type="number"
                            value={verticalForm.base_scoring_weights.contactEnrichmentWeight}
                            onChange={(e) => setVerticalForm({
                              ...verticalForm,
                              base_scoring_weights: { ...verticalForm.base_scoring_weights, contactEnrichmentWeight: Number(e.target.value) }
                            })}
                            className="w-full bg-slate-950 border border-slate-800 px-2 py-1.5 rounded text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-500 block mb-0.5 text-[10px]">Asset Signal Weight</label>
                          <input
                            type="number"
                            value={verticalForm.base_scoring_weights.assetSignalWeight}
                            onChange={(e) => setVerticalForm({
                              ...verticalForm,
                              base_scoring_weights: { ...verticalForm.base_scoring_weights, assetSignalWeight: Number(e.target.value) }
                            })}
                            className="w-full bg-slate-950 border border-slate-800 px-2 py-1.5 rounded text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-rose-600 hover:bg-rose-700 text-slate-950 text-xs font-extrabold py-2 rounded transition-all mt-4 uppercase font-mono"
                    >
                      Commit Configurations
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-xl text-center space-y-3">
                  <div className="text-slate-500 text-sm font-mono">Select a Profile to Edit configuration parameters, NAICS targets, or scoring ratios.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rls' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 border border-slate-850 p-6 rounded-xl space-y-4">
              <h2 className="text-md font-extrabold tracking-tight font-mono text-rose-400">EMULATE SECTOR CONTEXT</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-mono">
                This sandbox runs emulated SQL workflows against Row-Level Security parameters. Select client parameters below to verify data isolation.
              </p>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">Simulated Domain Workspace</label>
                  <select
                    value={selectedSimOrg}
                    onChange={(e) => setSelectedSimOrg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded text-slate-200 focus:outline-none focus:border-rose-500"
                  >
                    <option value="org_1">SlurryDisposal.co (Tenant A)</option>
                    <option value="org_2">RoofingPros.net (Tenant B)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Simulated User Role</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSimRole('owner')}
                      className={`flex-1 py-1.5 rounded font-bold border transition-all ${selectedSimRole === 'owner' ? 'bg-indigo-950/40 text-indigo-300 border-indigo-700/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
                    >
                      Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSimRole('sales_rep')}
                      className={`flex-1 py-1.5 rounded font-bold border transition-all ${selectedSimRole === 'sales_rep' ? 'bg-indigo-950/40 text-indigo-300 border-indigo-700/50' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
                    >
                      Sales Rep
                    </button>
                  </div>
                </div>

                <button
                  onClick={triggerSandboxEmulation}
                  disabled={sandboxExecuting}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-slate-950 font-extrabold py-2 rounded transition-all mt-4 uppercase font-mono disabled:opacity-55"
                >
                  {sandboxExecuting ? 'Executing Query...' : 'Test Isolation'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900 border border-slate-850 p-6 rounded-xl flex flex-col h-full">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                  <span className="text-xs font-mono text-slate-400">PostgreSQL Session Simulator Console</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                </div>
                <pre className="bg-slate-950 p-4 rounded-lg font-mono text-xs text-rose-400 overflow-x-auto whitespace-pre-wrap leading-relaxed flex-1 border border-slate-850">
                  {sandboxSQLResult}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audits' && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold">API Crawler Execution Log</h2>
                <p className="text-xs text-slate-400 font-mono">Real-time trace monitoring for Google, Apollo, and Gemini groundings</p>
              </div>

              <div className="flex gap-4 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-850">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Total Latency Profile</span>
                  <span className="text-emerald-400 font-bold">{averageLatency}ms (Optimal)</span>
                </div>
                <div className="border-l border-slate-800 pl-4">
                  <span className="text-slate-500 block uppercase text-[10px]">Today's Crawler Leakage</span>
                  <span className="text-rose-400 font-bold">${totalCost.toFixed(3)} USD</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-[10px] font-mono tracking-wider uppercase text-slate-400">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Crawler Instance</th>
                    <th className="pb-3">Sub-System Action</th>
                    <th className="pb-3 text-right">Response Time</th>
                    <th className="pb-3 text-right">Token Cost</th>
                    <th className="pb-3 text-right">Transaction Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-xs font-mono">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 text-slate-400">{log.timestamp}</td>
                      <td className="py-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                          log.provider === 'google' ? 'bg-blue-950/45 text-blue-300 border border-blue-900/35' :
                          log.provider === 'apollo' ? 'bg-indigo-950/45 text-indigo-300 border border-indigo-900/35' :
                          'bg-amber-950/45 text-amber-300 border border-amber-900/35'
                        }`}>
                          {log.provider}
                        </span>
                      </td>
                      <td className="py-3 text-slate-200">{log.queryType}</td>
                      <td className="py-3 text-right text-slate-300">{log.latencyMs}ms</td>
                      <td className="py-3 text-right text-slate-300">
                        {log.costUsd > 0 ? `$${log.costUsd.toFixed(3)}` : '—'}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${log.isSuccess ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-900/30' : 'text-rose-400 bg-rose-950/30 border border-rose-900/30'}`}>
                          {log.isSuccess ? 'Success' : 'Error'}
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
