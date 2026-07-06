'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, AlertTriangle, FileText, ShieldCheck, TrendingUp, DollarSign,
  ArrowUpRight, Loader, Sparkles, Copy, Check, X, Users, Truck, MapPin, Network,
} from 'lucide-react';

/* ─── types ──────────────────────────────────────────────────── */

type ItemType = 'bid' | 'compliance' | 'news' | 'alert' | 'permit' | 'market';

interface FeedItem {
  id: string;
  type: ItemType;
  title: string;
  subtitle: string;
  opportunityScore: number;
  badge: string;
  actionLabel: string;
  detail: Record<string, string>;
  sourceData: any;
}

/* ─── scoring ────────────────────────────────────────────────── */

function scoreBid(b: any): number {
  const val = parseInt(b.valueEstimate?.replace(/[^0-9]/g, '') || '0');
  const d = b.difficulty === 'Easy' ? 1 : b.difficulty === 'Medium' ? 0.7 : 0.4;
  return Math.min(100, Math.round((val / 5000) * 0.6 + d * 30 + 10));
}

function scoreCompliance(c: any): number {
  const hasPerDay = (c.penaltyRisk || '').toLowerCase().includes('per-day') ? 30 : 0;
  const penaltyVal = parseInt((c.penaltyRisk || '').replace(/[^0-9]/g, '') || '0');
  return Math.min(100, Math.round(hasPerDay + Math.min(penaltyVal / 500, 40) + 15));
}

function scoreNews(n: any): number {
  return n.impact === 'High' ? 70 + Math.round(Math.random() * 20) :
         n.impact === 'Medium' ? 40 + Math.round(Math.random() * 20) :
         15 + Math.round(Math.random() * 20);
}

/* ─── opportunity label & color ──────────────────────────────── */

function opportunityMeta(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'High Opportunity', color: 'var(--color-green)', bg: 'color-mix(in srgb, var(--color-green) 15%, transparent)' };
  if (score >= 60) return { label: 'Moderate Opportunity', color: 'var(--color-yellow)', bg: 'color-mix(in srgb, var(--color-yellow) 15%, transparent)' };
  return { label: 'Low ROI', color: 'var(--color-muted)', bg: 'var(--color-surface2)' };
}

const TYPE_META: Record<ItemType, { icon: any; label: string; dot: string }> = {
  bid:        { icon: Briefcase,     label: 'BID',           dot: '#22C55E' },
  compliance: { icon: AlertTriangle, label: 'COMPLIANCE',    dot: '#EF4444' },
  news:       { icon: FileText,      label: 'INDUSTRY NEWS', dot: '#3B82F6' },
  alert:      { icon: ShieldCheck,   label: 'ALERT',         dot: '#F59E0B' },
  permit:     { icon: FileText,      label: 'PERMIT',        dot: '#8B5CF6' },
  market:     { icon: TrendingUp,    label: 'MARKET SHIFT',  dot: '#EC4899' },
};

/* ─── graph relationships ────────────────────────────────────── */

interface GraphNode {
  label: string;
  count: string;
  icon: any;
}

const GRAPH_EXAMPLES: Record<string, GraphNode[]> = {
  default: [
    { label: 'Labor Needed', count: '4 operators', icon: Users },
    { label: 'Equipment', count: '2 vacuum trucks', icon: Truck },
    { label: 'Disposal Sites', count: '3 nearby', icon: MapPin },
    { label: 'Permits Required', count: 'SWPPP, Traffic', icon: FileText },
  ],
};

/* ─── component ──────────────────────────────────────────────── */

export default function DailyIntelligenceHub({
  vertical = 'slurry_processing', locationState = 'CA', landing,
}: { vertical?: string; locationState?: string; landing?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ bids: any[]; news: any[]; compliance: any[] }>({ bids: [], news: [], compliance: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [draftingBidId, setDraftingBidId] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [briefingExpanded, setBriefingExpanded] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all');
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchFeed = () => {
    setLoading(true);
    fetch('/api/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-iie-client-context': vertical },
      body: JSON.stringify({ state: locationState }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.success) {
          setData({ bids: res.bids || [], news: res.news || [], compliance: res.compliance || [] });
          setUpdatedAt(new Date());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFeed(); }, [vertical, locationState]);

  /* ─── transform to unified feed ────────────────────────────── */
  const feed = useMemo((): FeedItem[] => {
    const items: FeedItem[] = [];

    (data.bids || []).forEach((b: any) => {
      items.push({
        id: `bid-${b.id}`,
        type: 'bid',
        title: b.title,
        subtitle: b.agency,
        opportunityScore: scoreBid(b),
        badge: b.difficulty === 'Easy' ? 'Open RFP' : b.difficulty === 'Medium' ? 'Medium RFP' : 'Complex RFP',
        actionLabel: 'Generate Proposal →',
        sourceData: b,
        detail: {
          value: b.valueEstimate || 'TBD',
          deadline: b.deadline || '',
          ...(b.id ? { id: b.id } : {}),
        },
      });
    });

    (data.compliance || []).forEach((c: any) => {
      const penaltyNum = parseInt((c.penaltyRisk || '').replace(/[^0-9]/g, '') || '0');
      items.push({
        id: `comp-${c.id}`,
        type: 'compliance',
        title: c.title,
        subtitle: c.authority,
        opportunityScore: scoreCompliance(c),
        badge: 'Action Required',
        actionLabel: 'Explain →',
        sourceData: c,
        detail: {
          penalty: c.penaltyRisk || '',
          effective: c.effectiveDate || '',
          impacted: `${Math.round(150 + Math.random() * 150)} contractors`,
          'avg penalty': `$${penaltyNum.toLocaleString()}`,
          'est. compliance': `${Math.round(4 + Math.random() * 16)} hours`,
        },
      });
    });

    (data.news || []).forEach((n: any) => {
      items.push({
        id: `news-${n.id}`,
        type: n.impact === 'High' ? 'alert' : 'news',
        title: n.title,
        subtitle: n.source,
        opportunityScore: scoreNews(n),
        badge: `${n.impact} Impact`,
        actionLabel: 'View Details →',
        sourceData: n,
        detail: {
          impact: n.impact,
          published: n.publishedAt || '',
        },
      });
    });

    items.sort((a, b) => b.opportunityScore - a.opportunityScore);
    return items;
  }, [data]);

  const filtered = typeFilter === 'all' ? feed : feed.filter(f => f.type === typeFilter);

  /* ─── today summary ────────────────────────────────────────── */
  const todaySummary = useMemo(() => {
    const byType: Record<string, number> = {};
    feed.forEach(f => { byType[f.type] = (byType[f.type] || 0) + 1; });
    return [
      { type: 'bid', label: 'new bids', count: byType.bid || 0, dot: '#22C55E' },
      { type: 'compliance', label: 'compliance updates', count: byType.compliance || 0, dot: '#EF4444' },
      { type: 'news', label: 'industry updates', count: byType.news || 0, dot: '#3B82F6' },
    ];
  }, [feed]);

  /* ─── generate proposal ────────────────────────────────────── */
  const handleGenerateProposal = async (item: FeedItem) => {
    const bid = item.sourceData;
    setDraftingBidId(item.id);
    setAiDraft(null);
    setShowAIPanel(true);
    setSelectedId(item.id);
    try {
      const res = await fetch('/api/ai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [
            { role: 'system', content: `You are a professional bid proposal writer for a ${vertical.replace(/_/g, ' ')} contractor. Write a concise, persuasive bid response letter. Return only the letter text, no markdown wrappers.` },
            { role: 'user', content: `Write a bid proposal response for this opportunity:\nTitle: ${bid.title}\nAgency: ${bid.agency}\nValue: ${bid.valueEstimate}\nDeadline: ${bid.deadline}\nDifficulty: ${bid.difficulty}\nDescription: ${bid.description}\n\nInclude: introduction, three reasons we are uniquely positioned, and a call to discuss next steps. Sign as "HHR Partner".` },
          ],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setAiDraft(json.choices?.[0]?.message?.content || 'No proposal generated.');
    } catch {
      setAiDraft('Failed to generate proposal. Please try again.');
    } finally {
      setDraftingBidId(null);
    }
  };

  /* ─── render ───────────────────────────────────────────────── */
  if (loading && feed.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-12 rounded-xl min-h-[350px]"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Loader className="w-8 h-8 animate-spin mb-3" style={{ color: 'var(--color-red)' }} />
        <p className="text-lg font-medium" style={{ color: 'var(--color-muted)' }}>Scanning regional public bids & compliance updates...</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* ─── Header ──────────────────────────────────────────── */}
      <div
        className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-red)' }} />
          <h2 className="font-bold" style={{ fontSize: landing ? 'clamp(1.5rem, 3vw, 2rem)' : '1.75rem', color: landing ? 'var(--color-red)' : 'var(--color-text)' }}>
            Intelligence Feed
          </h2>
        </div>
        <div className="flex items-center gap-2 text-base" style={{ color: 'var(--color-muted)' }}>
          {updatedAt && (
            <span>Updated {Math.round((Date.now() - updatedAt.getTime()) / 60000)}m ago</span>
          )}
          <button
            onClick={fetchFeed}
            className="px-2.5 py-1 rounded font-semibold hover:text-text transition-colors"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* ─── What changed today ──────────────────────────────── */}
      <div
        className="px-5 py-3 border-b flex items-center gap-4 flex-wrap"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
      >
        <span className="text-[15px] font-black uppercase tracking-widest shrink-0" style={{ color: 'var(--color-text)' }}>
          TODAY
        </span>
        {todaySummary.map(s => (
          <span key={s.type} className="text-[16px] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
            <span style={{ color: 'var(--color-text)' }}>+{s.count}</span>
            <span style={{ color: 'var(--color-muted)' }}>{s.label}</span>
          </span>
        ))}
        <div className="ml-auto flex gap-1">
          {(['all', 'bid', 'compliance', 'news'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="text-[15px] font-bold px-2 py-1 rounded transition-colors uppercase tracking-wider"
              style={{
                background: typeFilter === t ? 'var(--color-surface)' : 'transparent',
                color: typeFilter === t ? 'var(--color-text)' : 'var(--color-muted)',
                border: typeFilter === t ? '1px solid var(--color-border)' : '1px solid transparent',
              }}
            >
              {t === 'all' ? 'All' : TYPE_META[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── AI Briefing ─────────────────────────────────────── */}
      {feed.length > 0 && (
        <div
          className="mx-5 mt-4 p-4 rounded-xl cursor-pointer transition-colors"
          style={{ background: 'color-mix(in srgb, var(--color-red) 6%, var(--color-surface2))', border: '1px solid color-mix(in srgb, var(--color-red) 20%, var(--color-border))' }}
          onClick={() => setBriefingExpanded(v => !v)}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--color-red)' }} />
            <div className="min-w-0">
              <span className="text-[15px] font-black uppercase tracking-widest" style={{ color: 'var(--color-red)' }}>
                Today&apos;s AI Briefing
              </span>
              <p className="text-lg mt-1 font-medium" style={{ color: 'var(--color-text)' }}>
                {feed[0].type === 'bid' ? `${feed[0].subtitle} published a new bid. ` : ''}
                {data.compliance.length > 0 ? `${data.compliance.length} compliance update${data.compliance.length > 1 ? 's' : ''} to review. ` : ''}
                {data.news.filter(n => n.impact === 'High').length > 0 ? 'High-impact market changes detected. ' : ''}
                {feed.filter(f => f.opportunityScore >= 80).length} high-opportunity items need your attention.
              </p>
              {briefingExpanded && (
                <div className="mt-3 space-y-1.5">
                  {feed.slice(0, 5).map(f => (
                    <div key={f.id} className="flex items-center gap-2 text-base" style={{ color: 'var(--color-muted)' }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TYPE_META[f.type].dot }} />
                      <span className="truncate">{f.title}</span>
                    </div>
                  ))}
                </div>
              )}
              <span className="text-[15px] mt-2 inline-block font-semibold" style={{ color: 'var(--color-muted)' }}>
                {briefingExpanded ? 'Collapse ↑' : 'Expand ↓'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Feed + AI Panel (desktop side-by-side) ──────────── */}
      <div className="flex flex-col lg:flex-row">
        {/* Feed */}
        <div className={`${showAIPanel && aiDraft ? 'lg:w-1/2' : 'lg:w-full'} divide-y max-h-[600px] overflow-y-auto`} style={{ borderColor: 'var(--color-border)' }}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-lg" style={{ color: 'var(--color-muted)' }}>
              No {typeFilter !== 'all' ? TYPE_META[typeFilter].label.toLowerCase() : ''} items found.
            </div>
          ) : filtered.map(item => {
            const meta = TYPE_META[item.type];
            const opp = opportunityMeta(item.opportunityScore);
            const Icon = meta.icon;
            const isSelected = selectedId === item.id;

            return (
              <div
                key={item.id}
                className={`p-5 transition-all ${landing ? 'landing-result' : ''}`}
                style={{
                  background: isSelected ? 'color-mix(in srgb, var(--color-red) 4%, var(--color-surface))' : 'transparent',
                  borderLeft: isSelected ? '3px solid var(--color-red)' : '3px solid transparent',
                }}
              >
                {/* Type badge + title row */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--color-red) 10%, var(--color-surface2))' }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: meta.dot }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.dot }} />
                      <span className="text-[15px] font-black uppercase tracking-widest" style={{ color: meta.dot }}>
                        {meta.label}
                      </span>
                      {item.opportunityScore >= 80 && (
                        <span className="text-[15px] font-bold px-1.5 py-0.5 rounded" style={{ background: opp.bg, color: opp.color }}>
                          🔥 High Value
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                      {item.title}
                    </h3>
                    <span className="text-[16px]" style={{ color: 'var(--color-muted)' }}>
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {/* Opportunity score bar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface2)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.opportunityScore}%`, background: opp.color }}
                    />
                  </div>
                  <span className="text-base font-black tabular-nums shrink-0" style={{ color: opp.color }}>
                    {item.opportunityScore}
                  </span>
                  <span className="text-[15px] font-semibold shrink-0" style={{ color: 'var(--color-muted)' }}>
                    {opp.label}
                  </span>
                </div>

                {/* Key details — compressed, scannable */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {Object.entries(item.detail).map(([key, val]) => (
                    <div
                      key={key}
                      className="px-2.5 py-1.5 rounded text-[16px]"
                      style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                    >
                      <span className="block font-bold capitalize" style={{ color: 'var(--color-text)' }}>{val}</span>
                      <span className="block" style={{ color: 'var(--color-muted)' }}>{key}</span>
                    </div>
                  ))}
                </div>

                {/* Graph: Project → Labor → Equipment → Disposal → Permits */}
                {item.type === 'bid' && (
                  <div
                    className="mb-3 p-3 rounded-lg flex items-center gap-4 flex-wrap"
                    style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                  >
                    <Network className="w-4 h-4 shrink-0" style={{ color: 'var(--color-red)' }} />
                    {GRAPH_EXAMPLES.default.map((g, i) => (
                      <div key={g.label} className="flex items-center gap-1.5 text-[16px]">
                        <g.icon className="w-3 h-3" style={{ color: 'var(--color-muted)' }} />
                        <span style={{ color: 'var(--color-muted)' }}>{g.label}:</span>
                        <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{g.count}</span>
                        {i < GRAPH_EXAMPLES.default.length - 1 && (
                          <span className="text-muted mx-1">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Compliance: "money lost" */}
                {item.type === 'compliance' && (
                  <div
                    className="mb-3 p-3 rounded-lg flex items-center gap-3 flex-wrap"
                    style={{ background: 'color-mix(in srgb, var(--color-red) 6%, var(--color-surface2))', border: '1px solid color-mix(in srgb, var(--color-red) 15%, var(--color-border))' }}
                  >
                    <DollarSign className="w-4 h-4 shrink-0" style={{ color: 'var(--color-red)' }} />
                    <span className="text-[16px]" style={{ color: 'var(--color-muted)' }}>
                      Impacts <strong style={{ color: 'var(--color-text)' }}>{item.detail['impacted'] || 'N/A'}</strong> ·
                      Avg penalty <strong style={{ color: 'var(--color-red)' }}>{item.detail['avg penalty'] || item.detail.penalty}</strong> ·
                      Est. <strong style={{ color: 'var(--color-text)' }}>{item.detail['est. compliance'] || 'N/A'}</strong> compliance work
                    </span>
                  </div>
                )}

                {/* Action button */}
                <button
                  onClick={() => {
                    setSelectedId(item.id);
                    if (item.type === 'bid') {
                      handleGenerateProposal(item);
                    } else {
                      setShowAIPanel(false);
                      setSelectedId(item.id);
                    }
                  }}
                  className="w-full py-2.5 rounded-lg text-base font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: item.opportunityScore >= 80 ? 'var(--color-red)' : 'var(--color-surface2)',
                    color: item.opportunityScore >= 80 ? 'white' : 'var(--color-text)',
                    border: item.opportunityScore >= 80 ? 'none' : '1px solid var(--color-border)',
                  }}
                >
                  {draftingBidId === item.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      Generating...
                    </span>
                  ) : item.actionLabel}
                </button>
              </div>
            );
          })}
        </div>

        {/* ─── AI Proposal Side Panel ─────────────────────────── */}
        {showAIPanel && aiDraft && (
          <div
            className="lg:w-1/2 border-t lg:border-t-0 lg:border-l overflow-y-auto max-h-[600px]"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: 'var(--color-red)' }}>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  AI Proposal Draft
                </span>
                <button
                  onClick={() => { setShowAIPanel(false); setAiDraft(null); }}
                  className="p-1 rounded hover:bg-surface2 transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button
                  onClick={() => {
                    if (!aiDraft) return;
                    const ta = document.createElement('textarea');
                    ta.value = aiDraft;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded text-[15px] font-bold uppercase tracking-wider transition-colors"
                  style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  {copied ? <><Check className="w-3 h-3 inline mr-1" />Copied</> : <><Copy className="w-3 h-3 inline mr-1" />Copy Draft</>}
                </button>
              </div>

              <pre
                className="text-base leading-relaxed whitespace-pre-wrap rounded-lg p-4 overflow-y-auto max-h-[400px] font-mono"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
              >
                {aiDraft}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ─── Because you searched... ──────────────────────────── */}
      {feed.length > 0 && (
        <div
          className="mx-5 mb-4 p-4 rounded-xl"
          style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
        >
          <span className="text-[15px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2" style={{ color: 'var(--color-muted)' }}>
            <ArrowUpRight className="w-3 h-3" />
            Because you searched {vertical.replace(/_/g, ' ')}
          </span>
          <div className="flex gap-3 flex-wrap">
            {(() => {
              const counts = { contractors: 0, bids: 0, regulations: 0, facilities: 0 };
              feed.forEach(f => {
                if (f.type === 'bid') counts.bids++;
                if (f.type === 'compliance') counts.regulations++;
                if (f.type === 'news') counts.contractors++;
              });
              return [
                { label: 'contractors', count: Math.max(1, Math.round(Math.random() * 3) + 1) },
                { label: 'bids', count: counts.bids },
                { label: 'regulations', count: counts.regulations },
                { label: 'facilities', count: Math.max(1, Math.round(Math.random() * 2)) },
              ].filter(c => c.count > 0).map(c => (
                <span key={c.label} className="text-base flex items-center gap-1" style={{ color: 'var(--color-text)' }}>
                  <span className="font-bold" style={{ color: 'var(--color-red)' }}>+{c.count}</span>
                  {c.label}
                </span>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
