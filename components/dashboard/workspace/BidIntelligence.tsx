'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Gavel, FileText, Upload, AlertTriangle, DollarSign,
  TrendingUp, Shield, Wand2, Loader2, Download, Folder, Globe,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useProject } from '@/context/ProjectContext';
import { getVerticalEstimatorConfig } from '@/lib/logistics/normalizer';
import { VERTICAL_LOGISTICS_OVERRIDES, LOGISTICS_BASE_DEFAULTS } from '@/lib/logistics/vertical-configs';
import { translateBidsList, TranslatableBid } from '@/lib/translation/bid-translator';

export default function BidIntelligence() {
  const { t, language } = useLanguage();
  const { activeProject, updateProject, projects, bookEquipment, releaseEquipment } = useProject();

  const [scopeInput, setScopeInput] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractStep, setExtractStep] = useState('');
  const [extracted, setExtracted] = useState(false);

  // Profitability inputs
  const [revenue, setRevenue] = useState(activeProject?.contractRevenue ?? 12000);
  const [laborCost, setLaborCost] = useState(activeProject?.laborCost ?? 1500);
  const [contingency, setContingency] = useState(activeProject?.contingency ?? 10);

  const [bidListings, setBidListings] = useState<TranslatableBid[]>([]);
  const [translatedBids, setTranslatedBids] = useState<TranslatableBid[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);

  const verticalConfig = activeProject
    ? getVerticalEstimatorConfig(activeProject.vertical)
    : null;

  const disposalCost = activeProject && verticalConfig
    ? activeProject.volume * verticalConfig.disposalFeePerGallon
    : 2500;

  const totalEquipmentCost = activeProject
    ? activeProject.bookedEquipment.reduce((sum, eqId) => {
        const type = eqId.split('-')[0];
        const override = VERTICAL_LOGISTICS_OVERRIDES[type];
        const dailyRate = override?.truckHourlyRate ? override.truckHourlyRate * 8 : LOGISTICS_BASE_DEFAULTS.truckHourlyRate * 8;
        const delivery = 0;
        return sum + dailyRate + delivery;
      }, 0)
    : 1450;

  const baseCosts = laborCost + disposalCost + totalEquipmentCost;
  const contingencyAmt = baseCosts * (contingency / 100);
  const totalProjectCost = baseCosts + contingencyAmt;
  const grossProfit = revenue - totalProjectCost;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  const getRiskLevel = () => {
    if (margin < 10) return { label: t('critical'), color: 'var(--color-red)', bg: 'color-mix(in srgb, var(--color-red) 12%, transparent)' };
    if (margin < 30) return { label: t('medium'), color: 'var(--color-yellow)', bg: 'color-mix(in srgb, var(--color-yellow) 12%, transparent)' };
    return { label: t('optimal'), color: 'var(--color-green)', bg: 'color-mix(in srgb, var(--color-green) 12%, transparent)' };
  };

  const risk = getRiskLevel();

  useEffect(() => {
    if (!activeProject?.vertical) return;
    setBidsLoading(true);

    fetch('/api/bid-intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verticalId: activeProject.vertical,
        zip: activeProject.zip,
        activeOnly: true,
      }),
    })
      .then(res => res.json())
      .then(async (data) => {
        const raw: TranslatableBid[] = (data.bids || []).map((b: any) => ({
          id: b.id || b._id || Math.random().toString(36).slice(2),
          title: b.title || b.projectName || '',
          agencyOrClient: b.agencyOrClient || b.agency || b.client || '',
          extractedScope: b.extractedScope || b.scope || b.description || '',
          locationCity: b.locationCity || b.city || '',
        }));

        setBidListings(raw);
        setBidsLoading(false);
      })
      .catch(() => setBidsLoading(false));
  }, [activeProject?.vertical]);

  useEffect(() => {
    if (bidListings.length === 0) return;
    translateBidsList(bidListings, language).then(setTranslatedBids);
  }, [bidListings, language]);

  const handleExtract = useCallback(() => {
    if (!activeProject) return;
    setExtracting(true);
    setExtractProgress(0);
    setExtracted(false);

    const steps = [
      { p: 20, text: t('scanning project specification headers...') },
      { p: 45, text: t('extracting work spec requirements & waste definitions...') },
      { p: 70, text: t('resolving environmental compliance codes...') },
      { p: 90, text: t('generating bid proposal draft...') },
      { p: 100, text: t('ai parameter parsing complete.') },
    ];

    let i = 0;
    const timer = setInterval(() => {
      if (i < steps.length) {
        setExtractProgress(steps[i].p);
        setExtractStep(steps[i].text);
        i++;
      }
    }, 600);

    const scopeText = scopeInput || activeProject.draftProposal || '';

    fetch('/api/ai/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          {
            role: 'system',
            content: `You are a construction bid analyst. Extract work specifications from the scope text and generate a professional bid proposal. Return valid JSON only with fields: spec (string, the work specification summary), proposal (string, the full bid proposal). No markdown wrappers.`,
          },
          {
            role: 'user',
            content: `Project: ${activeProject.name}
Vertical: ${activeProject.vertical.replace(/_/g, ' ')}
Volume: ${activeProject.volume.toLocaleString()} gal
Scope: ${scopeText || 'General ' + activeProject.vertical.replace(/_/g, ' ') + ' services'}

Extract the work spec and write a bid proposal.`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 2048,
      }),
    })
      .then(res => res.json())
      .then(data => {
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('No response from AI');

        const parsed = JSON.parse(content);
        const spec = parsed.spec || activeProject.vertical.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const draft = parsed.proposal || `Bid proposal for ${activeProject.name}.`;

        setExtractProgress(100);
        setExtractStep('AI parameter parsing complete.');
        clearInterval(timer);
        setExtracting(false);
        setExtracted(true);

        updateProject(activeProject.id, {
          extractedSpec: spec,
          draftProposal: draft,
          contractRevenue: revenue,
          laborCost,
          contingency,
        });
      })
      .catch(err => {
        console.error('[AI Extraction] Error:', err);
        clearInterval(timer);
        setExtracting(false);

        const spec = activeProject.vertical.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const draft = `BID PROPOSAL\nPROJECT: ${activeProject.name}\nVERTICAL: ${spec}\nVOLUME: ${activeProject.volume.toLocaleString()} gal\nEST. DISPOSAL: $${Math.round(disposalCost).toLocaleString()}\n\nProposal generation unavailable. Please try again.`;

        setExtracted(true);
        updateProject(activeProject.id, {
          extractedSpec: spec,
          draftProposal: draft,
          contractRevenue: revenue,
          laborCost,
          contingency,
        });
      });
  }, [activeProject, disposalCost, revenue, laborCost, contingency, updateProject, scopeInput]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>{t('bid intelligence')}</h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
            {t('select or create a project workspace to enable bid analysis.')}
          </p>
        </div>
        <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Folder className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
          <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{t('no active project')}</div>
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('create a project from the sidebar to analyze bids.')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          {t('bid intelligence')}
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
          {t('scope analysis, cost breakdown, vendor recommendations, and proposal generation')}
        </p>
      </div>

      {/* Project context bar */}
      <div
        className="rounded-xl p-4 flex items-center gap-4"
        style={{ background: 'color-mix(in srgb, var(--color-indigo) 8%, var(--color-surface))', border: '1px solid color-mix(in srgb, var(--color-indigo) 20%, transparent)' }}
      >
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            {t('active project')}
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{activeProject.name}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {activeProject.vertical.replace(/_/g, ' ')} · {activeProject.volume.toLocaleString()} gal · ZIP {activeProject.zip} · {activeProject.linkedVendors.length} vendors · {activeProject.bookedEquipment.length} equipment
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* AI Extraction */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <Wand2 className="w-4 h-4" style={{ color: 'var(--color-pink)' }} />
            {t('scope analysis')}
          </h3>

          <div className="space-y-3">
            <textarea
              value={scopeInput || activeProject.draftProposal}
              onChange={e => setScopeInput(e.target.value)}
              placeholder={t('paste scope description, upload PDF, or describe the project...')}
              className="w-full h-28 bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex items-center gap-3 flex-wrap">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                <Upload className="w-4 h-4" /> {t('upload PDF')}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                <Upload className="w-4 h-4" /> {t('upload plans')}
              </button>
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {t('or type scope details above')}
              </span>
            </div>
          </div>

          <button
            onClick={handleExtract}
            disabled={extracting}
            className="btn-primary w-full"
            style={{ opacity: extracting ? 0.6 : 1 }}
          >
            {extracting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {t('extracting...')}</>
            ) : (
              <><Wand2 className="w-5 h-5" /> {t('analyze scope')}</>
            )}
          </button>

          {/* Progress bar */}
          {extracting && (
            <div className="p-4 rounded-xl space-y-2"
              style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between text-xs font-bold" style={{ color: 'var(--color-indigo)' }}>
                <span>{t('ai parser scanning')}</span>
                <Loader2 className="w-3 h-3 animate-spin" />
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${extractProgress}%`, background: 'var(--color-indigo)' }} />
              </div>
              <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{extractStep}</div>
            </div>
          )}

          {/* Extracted params */}
          {extracted && activeProject.extractedSpec && (
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
            >
              <h4 className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--color-green)' }}>
                <Shield className="w-3 h-3" /> {t('extracted parameters')}
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded" style={{ background: 'var(--color-surface)' }}>
                  <div className="text-xs font-bold uppercase" style={{ color: 'var(--color-muted)' }}>{t('work spec')}</div>
                  <div className="font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>{activeProject.extractedSpec}</div>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--color-surface)' }}>
                  <div className="text-xs font-bold uppercase" style={{ color: 'var(--color-muted)' }}>{t('volume')}</div>
                  <div className="font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>{activeProject.volume.toLocaleString()} gal</div>
                </div>
              </div>
              <textarea
                readOnly
                value={activeProject.draftProposal}
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded text-xs font-mono p-2 text-slate-300 focus:outline-none"
              />
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                <Download className="w-3 h-3" /> {t('download proposal')}
              </button>
            </div>
          )}
        </div>

        {/* Profitability Engine */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
            <DollarSign className="w-4 h-4" style={{ color: 'var(--color-green)' }} />
            {t('profitability engine')}
          </h3>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>{t('contract revenue ($)')}</label>
                <input type="number" value={revenue} onChange={e => setRevenue(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>{t('labor cost ($)')}</label>
                <input type="number" value={laborCost} onChange={e => setLaborCost(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>{t('disposal fee')}</label>
                <input type="number" value={Math.round(disposalCost)} readOnly
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 text-slate-400 font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>{t('equipment rent')}</label>
                <input type="number" value={Math.round(totalEquipmentCost)} readOnly
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg p-2 text-slate-400 font-mono" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>{t('contingency buffer')}</label>
                <span className="font-bold" style={{ color: 'var(--color-indigo)' }}>{contingency}%</span>
              </div>
              <input
                type="range" min="0" max="30" step="5" value={contingency}
                onChange={e => setContingency(parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1 rounded-lg cursor-pointer"
                style={{ background: 'var(--color-border)' }}
              />
            </div>
          </div>

          {/* Outputs */}
          <div
            className="p-4 rounded-xl space-y-4"
            style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
          >
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xs font-bold uppercase" style={{ color: 'var(--color-muted)' }}>{t('gross profit')}</div>
                <div className="text-lg font-bold font-mono" style={{ color: 'var(--color-text)' }}>
                  ${Math.round(grossProfit).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase" style={{ color: 'var(--color-muted)' }}>{t('margin')}</div>
                <div className="text-lg font-bold font-mono" style={{ color: margin > 30 ? 'var(--color-green)' : margin > 10 ? 'var(--color-yellow)' : 'var(--color-red)' }}>
                  {margin.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase" style={{ color: 'var(--color-muted)' }}>{t('risk score')}</div>
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded inline-block mt-1"
                  style={{ background: risk.bg, color: risk.color, border: `1px solid color-mix(in srgb, ${risk.color} 25%, transparent)` }}>
                  {risk.label}
                </span>
              </div>
            </div>

            <div className="text-xs pt-2 border-t flex items-center gap-2" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
              <AlertTriangle className="w-3 h-3" style={{ color: risk.color }} />
              {margin < 10
                ? t('margin critical — zero contingency safety net')
                : margin < 30
                ? t('margin within standard variance — keep contingency above 10%')
                : t('highly profitable — auto-lock bidding targets')}
            </div>
          </div>
        </div>
      </div>

      {/* Related Bids */}
      <div
        className="rounded-xl p-6 space-y-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Gavel className="w-4 h-4" style={{ color: 'var(--color-yellow)' }} />
          {t('related bid listings')}
          {language !== 'en' && <Globe className="w-3 h-3" style={{ color: 'var(--color-muted)' }} />}
        </h3>

        {bidsLoading ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            <Loader2 className="w-3 h-3 animate-spin" /> {t('loading bids...')}
          </div>
        ) : translatedBids.length === 0 ? (
          <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
            {t('no related bids found for this vertical.')}
          </div>
        ) : (
          <div className="space-y-2">
            {translatedBids.map((bid) => (
              <div key={bid.id}
                className="p-3 rounded-lg flex items-start gap-3"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: 'var(--color-text)' }}>
                    {bid.title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {bid.agencyOrClient}{bid.locationCity ? ` · ${bid.locationCity}` : ''}
                  </div>
                  <div className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--color-muted2)' }}>
                    {bid.extractedScope}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
