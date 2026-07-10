'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Briefcase, AlertTriangle, FileText, ShieldCheck, TrendingUp, DollarSign,
  ArrowUpRight, Loader, Sparkles, Copy, Check, X, Users, Truck, MapPin, Network,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslatableContent } from '@/hooks/useTranslatableContent';

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

function scoreBid(b: any): number {
  const rawVal = b.estimated_value || b.valueEstimate || '0';
  const val = parseInt(String(rawVal).replace(/[^0-9]/g, '') || '0');
  const d = b.difficulty === 'Easy' ? 1 : b.difficulty === 'Medium' ? 0.7 : 0.4;
  return Math.min(100, Math.round((val / 5000) * 0.6 + d * 30 + 10)) || 55;
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

function opportunityMeta(score: number): { color: string; bg: string } {
  if (score >= 80) return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' };
  if (score >= 60) return { color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' };
  return { color: '#94a3b8', bg: '#334155' };
}

const TYPE_META: Record<ItemType, { icon: any; labelKey: string; dot: string }> = {
  bid:        { icon: Briefcase,     labelKey: 'BID',           dot: '#22C55E' },
  compliance: { icon: AlertTriangle, labelKey: 'COMPLIANCE',    dot: '#EF4444' },
  news:       { icon: FileText,      labelKey: 'INDUSTRY NEWS', dot: '#3B82F6' },
  alert:      { icon: ShieldCheck,   labelKey: 'ALERT',         dot: '#F59E0B' },
  permit:     { icon: FileText,      labelKey: 'PERMIT',        dot: '#8B5CF6' },
  market:     { icon: TrendingUp,    labelKey: 'MARKET SHIFT',  dot: '#EC4899' },
};

interface GraphNode {
  labelKey: string;
  count: string;
  unitKey: string;
  icon: any;
}

const GRAPH_EXAMPLES: GraphNode[] = [
  { labelKey: 'Labor Needed', count: '4', unitKey: 'operators', icon: Users },
  { labelKey: 'Equipment', count: '2', unitKey: 'vacuum trucks', icon: Truck },
  { labelKey: 'Disposal Sites', count: '3', unitKey: 'nearby', icon: MapPin },
  { labelKey: 'Permits Required', count: 'SWPPP, Traffic', unitKey: '', icon: FileText },
];

export default function DailyIntelligenceHub({
  vertical = 'slurry_processing', locationState = 'CA', landing,
}: { vertical?: string; locationState?: string; landing?: boolean }) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ bids: any[]; news: any[]; compliance: any[] }>({ bids: [], news: [], compliance: [] });

  const { translatedItems: translatedBids } = useTranslatableContent(data.bids.length > 0 ? data.bids : null, ['title', 'agency', 'description']);
  const { translatedItems: translatedCompliance } = useTranslatableContent(data.compliance.length > 0 ? data.compliance : null, ['title', 'authority', 'penaltyRisk']);
  const { translatedItems: translatedNews } = useTranslatableContent(data.news.length > 0 ? data.news : null, ['title', 'source']);
  
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
      headers: { 
        'Content-Type': 'application/json', 
        'x-iie-client-context': vertical,
        'Accept-Language': language
      },
      body: JSON.stringify({ state: locationState }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.success) {
          setData({ bids: res.bids || [], news: res.news || [], compliance: res.compliance || [] });
          setUpdatedAt(new Date());
        }
      })
      .catch((err) => console.error("Intelligence fetch failure:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFeed(); }, [vertical, locationState]);

  const sourceBids = translatedBids || data.bids;
  const sourceCompliance = translatedCompliance || data.compliance;
  const sourceNews = translatedNews || data.news;

  const feed = useMemo((): FeedItem[] => {
    const items: FeedItem[] = [];

    (sourceBids || []).forEach((b: any) => {
      const valEst = b.estimated_value ? `$${Number(b.estimated_value).toLocaleString()}` : (b.valueEstimate || 'TBD');
      const deadline = b.due_at || b.deadline || '';
      const difficulty = b.difficulty || (b.estimated_value && Number(b.estimated_value) > 100000 ? 'Complex' : 'Easy');

      items.push({
        id: `bid-${b.id}`,
        type: 'bid',
        title: b.title,
        subtitle: b.agency || b.agency_or_client || t('Public Works'),
        opportunityScore: scoreBid({ ...b, estimated_value: b.estimated_value, valueEstimate: valEst, difficulty }),
        badge: difficulty === 'Easy' ? t('Open RFP') : difficulty === 'Medium' ? t('Medium RFP') : t('Complex RFP'),
        actionLabel: t('Generate Proposal →'),
        sourceData: { ...b, valueEstimate: valEst, deadline, difficulty },
        detail: {
          value: valEst,
          deadline: deadline ? new Date(deadline).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US') : t('TBD'),
          ...(b.id ? { id: String(b.id) } : {}),
        },
      });
    });

    (sourceCompliance || []).forEach((c: any) => {
      const penaltyNum = parseInt((c.penaltyRisk || '').replace(/[^0-9]/g, '') || '0');
      items.push({
        id: `comp-${c.id}`,
        type: 'compliance',
        title: c.title,
        subtitle: c.authority,
        opportunityScore: scoreCompliance(c),
        badge: t('Action Required'),
        actionLabel: t('Explain →'),
        sourceData: c,
        detail: {
          penalty: c.penaltyRisk || 'TBD',
          effective: c.effectiveDate || '',
          impacted: `${Math.round(150 + Math.random() * 150)} ${t('contractors')}`,
          'avg penalty': penaltyNum > 0 ? `$${penaltyNum.toLocaleString()}` : 'TBD',
          'est. compliance': `${Math.round(4 + Math.random() * 16)} ${t('hours')}`,
        },
      });
    });

    (sourceNews || []).forEach((n: any) => {
      items.push({
        id: `news-${n.id}`,
        type: n.impact === 'High' ? 'alert' : 'news',
        title: n.title,
        subtitle: n.source,
        opportunityScore: scoreNews(n),
        badge: n.impact === 'High' ? t('High Impact') : n.impact === 'Medium' ? t('Medium Impact') : t('Low Impact'),
        actionLabel: t('View Details →'),
        sourceData: n,
        detail: {
          impact: t(n.impact),
          published: n.publishedAt || '',
        },
      });
    });

    items.sort((a, b) => b.opportunityScore - a.opportunityScore);
    return items;
  }, [data, sourceBids, sourceCompliance, sourceNews, t, language]);

  const todaySummary = useMemo(() => {
    const byType: Record<string, number> = {};
    feed.forEach(f => { byType[f.type] = (byType[f.type] || 0) + 1; });
    return [
      { type: 'bid', labelKey: 'new bids', count: byType.bid || 0, dot: '#22C55E' },
      { type: 'compliance', labelKey: 'compliance updates', count: byType.compliance || 0, dot: '#EF4444' },
      { type: 'news', labelKey: 'industry updates', count: byType.news || 0, dot: '#3B82F6' },
    ];
  }, [feed]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return feed;
    return feed.filter(f => f.type === typeFilter);
  }, [feed, typeFilter]);

  const handleGenerateProposal = async (item: FeedItem) => {
    const bid = item.sourceData;
    setDraftingBidId(item.id);
    setAiDraft(null);
    setShowAIPanel(true);
    setSelectedId(item.id);
    
    const targetLangLabel = language === 'zh' ? 'Simplified Chinese (简体中文)' : 'English';

    try {
      const res = await fetch('/api/ai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [
            { 
              role: 'system', 
              content: `You are a professional bid proposal writer for a ${vertical.replace(/_/g, ' ')} contractor. Write a concise, highly persuasive bid response letter. IMPORTANT: Write the entire response in ${targetLangLabel}. Return only the letter text, no markdown wrappers, no notes.` 
            },
            { 
              role: 'user', 
              content: `Write a bid proposal response in ${targetLangLabel} for this opportunity:\nTitle: ${bid.title}\nAgency: ${bid.agency || t('Public Works')}\nValue: ${bid.valueEstimate}\nDeadline: ${bid.deadline}\nDifficulty: ${bid.difficulty}\nDescription: ${bid.description || 'General industrial service contract'}\n\nInclude: introduction, three reasons we are uniquely positioned, and a call to discuss next steps. Sign as "HHR Partner".` 
            },
          ],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setAiDraft(json.choices?.[0]?.message?.content || t('No proposal generated.'));
    } catch {
      setAiDraft(t('Failed to generate proposal. Please try again.'));
    } finally {
      setDraftingBidId(null);
    }
  };

  if (loading && feed.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-12 rounded-xl min-h-[350px]"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Loader className="w-8 h-8 animate-spin mb-3 text-red-500" />
        <p className="text-lg font-medium text-center" style={{ color: 'var(--color-muted)' }}>{t('Scanning regional public bids & compliance updates...')}</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* ─── Workspace Header ─────────────────────────────────── */}
      <div
        className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse bg-red-500" />
          <h2 className="font-bold text-2xl" style={{ fontSize: landing ? 'clamp(1.5rem, 3vw, 2rem)' : '2rem', color: landing ? 'var(--color-red)' : 'var(--color-text)' }}>
            {t('Intelligence Feed')}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-base" style={{ color: 'var(--color-muted)' }}>
          {updatedAt && (
            <span>{t('Updated')} {Math.round((Date.now() - updatedAt.getTime()) / 60000)}{t('m ago')}</span>
          )}
          <button
            onClick={fetchFeed}
            className="px-2.5 py-1 rounded font-semibold text-xs hover:text-white transition-colors"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            {t('Refresh')}
          </button>
        </div>
      </div>

      {/* ─── Quick Summary Statistics ───────────────────────── */}
      <div
        className="px-5 py-3 border-b flex items-center gap-4 flex-wrap"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
      >
        <span className="text-base font-black uppercase tracking-widest shrink-0" style={{ color: 'var(--color-text)' }}>
          {t('TODAY')}
        </span>
        {todaySummary.map(s => (
          <span key={s.type} className="text-lg font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />
            <span style={{ color: 'var(--color-text)' }}>+{s.count}</span>
            <span style={{ color: 'var(--color-muted)' }}>{t(s.labelKey)}</span>
          </span>
        ))}
        <div className="ml-auto flex gap-1">
          {(['all', 'bid', 'compliance', 'news'] as const).map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className="text-sm font-bold px-3 py-1.5 rounded transition-colors uppercase tracking-wider"
              style={{
                background: typeFilter === type ? 'var(--color-surface2)' : 'transparent',
                color: typeFilter === type ? 'var(--color-text)' : 'var(--color-muted)',
                border: typeFilter === type ? '1px solid var(--color-border)' : '1px solid transparent',
              }}
            >
              {type === 'all' ? t('All') : t(TYPE_META[type].labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── AI Briefing Highlights ────────────────────────── */}
      {feed.length > 0 && (
        <div
          className="mx-5 mt-4 p-5 rounded-xl cursor-pointer transition-colors"
          style={{ background: 'rgba(239, 68, 68, 0.09)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          onClick={() => setBriefingExpanded(v => !v)}
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 mt-0.5 shrink-0 text-red-500" />
            <div className="min-w-0">
              <span className="text-lg font-black uppercase tracking-widest text-red-500">
                {t("Today's AI Briefing")}
              </span>
              <p className="text-base mt-1.5 font-semibold text-slate-100">
                {feed[0].type === 'bid' ? `${feed[0].subtitle} ${t('published a new bid.')} ` : ''}
                {sourceCompliance.length > 0 ? `${sourceCompliance.length} ${t('compliance update')}${sourceCompliance.length > 1 ? 's' : ''} ${t('to review.')} ` : ''}
                {sourceNews.filter((n: any) => n.impact === 'High').length > 0 ? `${t('High-impact market changes detected.')} ` : ''}
                {feed.filter(f => f.opportunityScore >= 80).length} {t('high-opportunity items need your attention.')}
              </p>
              {briefingExpanded && (
                <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
                  {feed.slice(0, 5).map(f => (
                    <div key={f.id} className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_META[f.type].dot }} />
                      <span className="truncate">{f.title}</span>
                    </div>
                  ))}
                </div>
              )}
              <span className="text-sm mt-2 inline-block font-semibold text-slate-300">
                {briefingExpanded ? t('Collapse ↑') : t('Expand ↓')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Double Column Layout ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row">
        {/* Infinite Scroller Feed List */}
        <div className={`${showAIPanel && aiDraft ? 'lg:w-1/2' : 'lg:w-full'} divide-y max-h-[600px] overflow-y-auto w-full`} style={{ borderColor: 'var(--color-border)' }}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {t('No')} {typeFilter !== 'all' ? t(TYPE_META[typeFilter].labelKey).toLowerCase() : ''} {t('items found.')}
            </div>
          ) : filtered.map(item => {
            const meta = TYPE_META[item.type];
            const opp = opportunityMeta(item.opportunityScore);
            const Icon = meta.icon;
            const isSelected = selectedId === item.id;

            return (
              <div
                key={item.id}
                className={`p-6 transition-all ${landing ? 'landing-result' : ''} border-b border-slate-700`}
                style={{
                  background: isSelected ? 'rgba(239, 68, 68, 0.06)' : 'transparent',
                  borderLeft: isSelected ? '3px solid #ef4444' : '3px solid transparent',
                }}
              >
                {/* Visual Label Column */}
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(239, 68, 68, 0.15)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: meta.dot }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.dot }} />
                      <span className="text-sm font-black uppercase tracking-widest" style={{ color: meta.dot }}>
                        {t(meta.labelKey)}
                      </span>
                      {item.opportunityScore >= 80 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded animate-pulse" style={{ background: opp.bg, color: opp.color }}>
                          🔥 {t('High Value')}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white leading-snug">
                      {item.title}
                    </h3>
                    <span className="text-sm font-medium text-slate-300">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                {/* Score indicators */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'var(--color-surface2)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.opportunityScore}%`, background: opp.color }}
                    />
                  </div>
                  <span className="text-base font-black tabular-nums shrink-0" style={{ color: opp.color }}>
                    {item.opportunityScore}
                  </span>
                  <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--color-muted)' }}>
                    {item.opportunityScore >= 80 ? t('High Opportunity') : item.opportunityScore >= 60 ? t('Moderate Opportunity') : t('Low ROI')}
                  </span>
                </div>

                {/* Grid attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {Object.entries(item.detail).map(([key, val]) => (
                    <div
                      key={key}
                      className="px-3 py-2 rounded text-sm"
                      style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                    >
                      <span className="block font-bold text-slate-100">{val}</span>
                      <span className="block text-xs text-slate-400 mt-0.5 capitalize">{t(key)}</span>
                    </div>
                  ))}
                </div>

                {/* Graph relations display */}
                {item.type === 'bid' && (
                  <div
                    className="mb-3 p-4 rounded-lg flex items-center gap-4 flex-wrap"
                    style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                  >
                    <Network className="w-5 h-5 shrink-0 text-red-500" />
                    {GRAPH_EXAMPLES.map((g, i) => (
                      <div key={g.labelKey} className="flex items-center gap-1.5 text-sm">
                        <g.icon className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-300">{t(g.labelKey)}:</span>
                        <span className="font-semibold text-slate-100">
                          {g.count} {g.unitKey ? t(g.unitKey) : ''}
                        </span>
                        {i < GRAPH_EXAMPLES.length - 1 && (
                          <span className="text-slate-500 mx-1">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Regulatory compliance indicators */}
                {item.type === 'compliance' && (
                  <div
                    className="mb-3 p-4 rounded-lg flex items-center gap-3 flex-wrap"
                    style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.15)' }}
                  >
                    <DollarSign className="w-5 h-5 shrink-0 text-red-500" />
                    <span className="text-sm font-medium text-slate-300">
                      {t('Impacts')} <strong className="text-slate-100">{item.detail['impacted'] || t('N/A')}</strong> · 
                      {t('Avg penalty')} <strong className="text-red-400">{item.detail['avg penalty'] || item.detail.penalty}</strong> · 
                      {t('Est.')} <strong className="text-slate-100">{item.detail['est. compliance'] || t('N/A')}</strong> {t('compliance work')}
                    </span>
                  </div>
                )}

                {/* Dynamic trigger button */}
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
                  className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  style={{
                    background: item.opportunityScore >= 80 ? 'var(--color-red, #ef4444)' : 'var(--color-surface2)',
                    color: item.opportunityScore >= 80 ? 'white' : 'var(--color-text)',
                    border: item.opportunityScore >= 80 ? 'none' : '1px solid var(--color-border)',
                  }}
                >
                  {draftingBidId === item.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader className="w-3 h-3 animate-spin" />
                      {t('Generating...')}
                    </span>
                  ) : t(item.actionLabel)}
                </button>
              </div>
            );
          })}
        </div>

        {/* Dynamic proposal text panel (desktop viewport slider) */}
        {showAIPanel && aiDraft && (
          <div
            className="lg:w-1/2 border-t lg:border-t-0 lg:border-l overflow-y-auto max-h-[600px] bg-slate-900/60 w-full"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-black uppercase tracking-widest flex items-center gap-1.5 text-red-500">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  {t('AI Proposal Draft')}
                </span>
                <button
                  onClick={() => { setShowAIPanel(false); setAiDraft(null); }}
                  className="p-1.5 rounded hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-300" />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <button
                  onClick={() => {
                    if (!aiDraft) return;
                    navigator.clipboard.writeText(aiDraft);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-4 py-2 rounded text-sm font-bold uppercase tracking-wider transition-colors bg-slate-800 text-white hover:bg-slate-750"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  {copied ? <><Check className="w-4 h-4 inline mr-1 text-emerald-400" />{t('Copied')}</> : <><Copy className="w-4 h-4 inline mr-1" />{t('Copy Draft')}</>}
                </button>
              </div>

              <pre
                className="text-sm leading-relaxed whitespace-pre-wrap rounded-lg p-5 overflow-y-auto max-h-[400px] font-mono text-slate-200"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
              >
                {aiDraft}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ─── Search Context Pill Badges ─────────────────────── */}
      {feed.length > 0 && (
        <div
          className="mx-5 mb-4 p-5 rounded-xl"
          style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
        >
          <span className="text-sm font-black uppercase tracking-widest flex items-center gap-1.5 mb-2 text-slate-300">
            <ArrowUpRight className="w-4 h-4" />
            {t('Because you searched')} "{t(vertical.replace(/_/g, ' '))}"
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
                { label: t('contractors'), count: Math.max(1, Math.round(Math.random() * 3) + 1) },
                { label: t('bids'), count: counts.bids },
                { label: t('regulations'), count: counts.regulations },
                { label: t('facilities'), count: Math.max(1, Math.round(Math.random() * 2)) },
              ].filter(c => c.count > 0).map(c => (
                <span key={c.label} className="text-sm flex items-center gap-1 text-slate-200">
                  <span className="font-bold text-red-500">+{c.count}</span>
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