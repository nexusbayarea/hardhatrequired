'use client';

import { useState, useEffect } from 'react';
import { Calendar, Briefcase, FileText, AlertTriangle, ShieldCheck, ArrowUpRight, Loader, Sparkles, Copy, Check } from 'lucide-react';

interface Bid {
  id: string;
  title: string;
  agency: string;
  valueEstimate: string;
  deadline: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Complex';
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
  impact: 'High' | 'Medium' | 'Low';
  actionableTakeaway: string;
}

interface ComplianceRule {
  id: string;
  title: string;
  authority: string;
  effectiveDate: string;
  penaltyRisk: string;
  summary: string;
  requiredAction: string;
}

export default function DailyIntelligenceHub({ vertical = 'slurry_processing', locationState = 'CA', landing }: { vertical?: string; locationState?: string; landing?: boolean }) {
  const [activeTab, setActiveTab] = useState<'news' | 'compliance' | 'bids'>('news');
  const [loading, setLoading] = useState(true);
  const [draftingBidId, setDraftingBidId] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<{ bids: Bid[]; news: NewsItem[]; compliance: ComplianceRule[] }>({
    bids: [],
    news: [],
    compliance: []
  });

  useEffect(() => {
    async function fetchDailyFeeds() {
      setLoading(true);
      try {
        const response = await fetch('/api/intelligence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-iie-client-context': vertical
          },
          body: JSON.stringify({ state: locationState })
        });
        const resData = await response.json();
        if (resData.success) {
          setData({
            bids: resData.bids || [],
            news: resData.news || [],
            compliance: resData.compliance || []
          });
        }
      } catch (error) {
        console.error('[Intelligence Widget] Error pulling newsfeed:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDailyFeeds();
  }, [vertical, locationState]);

  const handleDraftProposal = async (bid: Bid) => {
    setDraftingBidId(bid.id);
    setAiDraft(null);

    try {
      const response = await fetch('/api/ai/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [
            {
              role: 'system',
              content: `You are a professional bid proposal writer for a ${vertical.replace('_', ' ')} contractor. Write a concise, persuasive bid response letter. Return only the letter text, no markdown wrappers.`,
            },
            {
              role: 'user',
              content: `Write a bid proposal response for this opportunity:
Title: ${bid.title}
Agency: ${bid.agency}
Value: ${bid.valueEstimate}
Deadline: ${bid.deadline}
Difficulty: ${bid.difficulty}
Description: ${bid.description}

Include: introduction, three reasons we are uniquely positioned (certifications, local logistics, regulatory compliance), and a call to discuss next steps. Sign as "HHR Partner".`,
            },
          ],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate proposal');
      }

      const data = await response.json();
      const proposalText = data.choices?.[0]?.message?.content || 'No proposal generated.';
      setAiDraft(proposalText);
    } catch (err) {
      console.error('[AI Pitch Bid] Error:', err);
      setAiDraft('Failed to generate proposal. Please try again.');
    } finally {
      setDraftingBidId(null);
    }
  };

  const handleCopyDraft = () => {
    if (!aiDraft) return;
    const textarea = document.createElement('textarea');
    textarea.value = aiDraft;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-surface border border-border rounded-xl min-h-[350px]">
        <Loader className="w-8 h-8 text-red animate-spin mb-3" />
        <p className="text-sm text-muted font-medium">Scanning regional public bids & compliance updates...</p>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-border bg-surface2/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
            <h2 className={`font-bold tracking-tight ${landing ? 'text-section' : 'text-lg'}`} style={{ color: landing ? 'var(--color-red)' : 'var(--color-text)' }}>Daily Intelligence Hub</h2>
          </div>
          <p className="text-xs text-muted">Localized bids, trends, and compliance alerts for {locationState}</p>
        </div>

        <div className="flex bg-surface2 p-1 rounded-lg border border-border self-stretch sm:self-auto justify-between gap-2">
          <button
            onClick={() => { setActiveTab('news'); setAiDraft(null); }}
            className={`flex items-center gap-1 px-4 py-2 rounded-md text-lg font-bold transition-all ${
              activeTab === 'news' ? 'bg-red text-white shadow-lg' : 'text-muted hover:text-text'
            }`}
          >
            <FileText className="w-5 h-5" />
            Industry News
          </button>
          <button
            onClick={() => { setActiveTab('compliance'); setAiDraft(null); }}
            className={`flex items-center gap-1 px-4 py-2 rounded-md text-lg font-bold transition-all ${
              activeTab === 'compliance' ? 'bg-red text-white shadow-lg' : 'text-muted hover:text-text'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            Compliance
          </button>
          <button
            onClick={() => { setActiveTab('bids'); setAiDraft(null); }}
            className={`flex items-center gap-1 px-4 py-2 rounded-md text-lg font-bold transition-all ${
              activeTab === 'bids' ? 'bg-red text-white shadow-lg' : 'text-muted hover:text-text'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            Bids ({data.bids.length})
          </button>
        </div>
      </div>

      <div className="p-6">
        {aiDraft && (
          <div className="mb-6 bg-surface2 border border-border rounded-lg p-5 relative">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs uppercase font-bold tracking-wider text-red flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-spin" /> AI Generated Proposal Draft
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyDraft}
                  className="p-1.5 hover:bg-surface2 rounded border border-border text-muted hover:text-text transition-colors flex items-center gap-1 text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Draft'}
                </button>
                <button
                  onClick={() => setAiDraft(null)}
                  className="text-xs text-muted hover:text-text px-2 py-1"
                >
                  Close
                </button>
              </div>
            </div>
            <pre className="text-xs text-muted font-mono whitespace-pre-wrap bg-surface p-4 rounded border border-border max-h-[250px] overflow-y-auto">
              {aiDraft}
            </pre>
          </div>
        )}

        {activeTab === 'news' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.news.map((item) => (
              <div key={item.id} className={`p-5 bg-surface2 border border-border rounded-lg flex flex-col justify-between hover:border-border/80 transition-colors ${landing ? 'landing-result' : ''}`}>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-bold text-muted uppercase tracking-wider ${landing ? 'text-[20px]' : 'text-xs'}`}>{item.source}</span>
                    <span className={`px-3 py-1 rounded font-bold ${landing ? 'text-[40px]' : 'text-xl'} ${
                      item.impact === 'High' ? 'bg-red/10 text-red' : 'bg-surface text-muted'
                    }`}>
                      {item.impact} Impact
                    </span>
                  </div>
                  <h3 className={`font-bold text-text mb-2 ${landing ? 'text-[28px]' : 'text-sm'}`}>{item.title}</h3>
                  <p className={`text-muted leading-relaxed mb-4 ${landing ? 'text-2xl' : 'text-xs'}`}>{item.summary}</p>
                </div>

                <div className="pt-3 border-t border-border bg-surface/40 p-3 rounded-md">
                  <span className={`font-extrabold text-red uppercase block tracking-wider mb-1 ${landing ? 'text-[20px]' : 'text-xs'}`}>Our Actionable Advice</span>
                  <p className={`text-muted italic ${landing ? 'text-2xl' : 'text-xs'}`}>"{item.actionableTakeaway}"</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-4">
            {data.compliance.map((rule) => (
              <div key={rule.id} className={`p-5 bg-red/5 border border-red/20 rounded-lg relative overflow-hidden ${landing ? 'landing-result' : ''}`}>
                <div className="absolute right-3 top-3 opacity-10">
                  <AlertTriangle className="w-24 h-24 text-red" />
                </div>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                  <div>
                    <span className={`font-bold text-red uppercase tracking-wide ${landing ? 'text-[20px]' : 'text-xs'}`}>{rule.authority} update</span>
                    <h3 className={`font-extrabold text-text mt-0.5 ${landing ? 'text-[32px]' : 'text-base'}`}>{rule.title}</h3>
                  </div>
                  <div className="text-right self-stretch sm:self-auto bg-red/10 p-2 rounded border border-red/20">
                    <span className={`block text-red uppercase font-bold tracking-wider ${landing ? 'text-[18px]' : 'text-xs'}`}>Audit Fine Risk</span>
                    <span className={`font-bold text-text whitespace-nowrap ${landing ? 'text-2xl' : 'text-xs'}`}>{rule.penaltyRisk}</span>
                  </div>
                </div>

                <p className={`text-muted leading-relaxed mb-4 ${landing ? 'text-2xl' : 'text-xs'}`}>{rule.summary}</p>

                <div className="p-3.5 bg-surface2/80 border border-border rounded-md">
                  <span className={`font-bold text-text flex items-center gap-1.5 mb-1.5 ${landing ? 'text-2xl' : 'text-xs'}`}>
                    <ShieldCheck className="w-4 h-4 text-green" /> Required Action Plan
                  </span>
                  <p className={`text-muted leading-relaxed ${landing ? 'text-2xl' : 'text-xs'}`}>{rule.requiredAction}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bids' && (
          <div className="space-y-4">
            {data.bids.length === 0 ? (
              <p className={`text-center text-muted ${landing ? 'text-[28px]' : 'text-sm'}`}>No active municipal bids discovered in your county today.</p>
            ) : (
              data.bids.map((bid) => (
                <div key={bid.id} className={`p-5 bg-surface2 border border-border hover:border-border/80 rounded-lg transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group ${landing ? 'landing-result' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded font-bold bg-surface text-muted border border-border ${landing ? 'text-[20px]' : 'text-xs'}`}>
                        {bid.agency}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-bold ${landing ? 'text-[20px]' : 'text-xs'} ${
                        bid.difficulty === 'Easy' ? 'bg-green/10 text-green' :
                        bid.difficulty === 'Medium' ? 'bg-yellow/10 text-yellow' : 'bg-blue/10 text-blue'
                      }`}>
                        {bid.difficulty} RFP
                      </span>
                    </div>
                    <h3 className={`font-bold text-text group-hover:text-red transition-colors ${landing ? 'text-[32px]' : 'text-base'}`}>{bid.title}</h3>
                    <p className={`text-muted mt-1 line-clamp-2 ${landing ? 'text-2xl' : 'text-xs'}`}>{bid.description}</p>

                    <div className={`flex items-center gap-4 mt-3 text-muted ${landing ? 'text-2xl' : 'text-xs'}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-muted" /> Deadline: {bid.deadline}
                      </span>
                      <span className="font-bold text-text">
                        Est: {bid.valueEstimate}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDraftProposal(bid)}
                    disabled={draftingBidId === bid.id}
                    className={`flex items-center gap-1.5 self-stretch md:self-auto justify-center px-4 py-2 bg-red hover:bg-red/80 text-white font-bold rounded-lg transition-colors whitespace-nowrap ${landing ? 'text-2xl' : 'text-xs'}`}>
                    {draftingBidId === bid.id ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Pitch Bid
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
