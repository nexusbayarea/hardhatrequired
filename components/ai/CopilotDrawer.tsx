'use client';

import { useState, useCallback } from 'react';
import { Bot, X, Truck, FileText, Search, ArrowRight, Check, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSearchState } from '@/context/SearchStateContext';

type CopilotMode = 'search' | 'logistics' | 'bid';

interface Suggestion {
  text: string;
  mode: CopilotMode;
}

interface Action {
  icon: string;
  text: string;
  done?: boolean;
}

const SUGGESTIONS: Suggestion[] = [
  { text: 'Find slurry disposal near Fremont', mode: 'search' },
  { text: 'Show direct operators only', mode: 'search' },
  { text: 'Increase radius to 50 miles', mode: 'search' },
  { text: 'Translate results to Chinese', mode: 'search' },
  { text: 'Estimate hauling cost for 4500 gal', mode: 'logistics' },
  { text: 'Help me bid this project', mode: 'bid' },
];

const MODE_META: Record<CopilotMode, { icon: typeof Search; label: string; accent: string }> = {
  search: { icon: Search, label: 'Search Mode', accent: 'var(--color-red)' },
  logistics: { icon: Truck, label: 'Logistics Mode', accent: 'var(--color-green)' },
  bid: { icon: FileText, label: 'Bid Mode', accent: 'var(--color-yellow)' },
};

const CITY_ZIPS: Record<string, string> = {
  fremont: '94538', oakland: '94607', sanfrancisco: '94102', sanjose: '95113',
  hayward: '94541', richmond: '94801', berkeley: '94704', concord: '94520',
  pleasanton: '94566', livermore: '94550', vallejo: '94590', fairfield: '94533',
  sacramento: '95814', stockton: '95202', antioch: '94509', fairfield: '94533',
};

interface CopilotResponse {
  message: string;
  actions?: Action[];
}

function parseAndExecute(input: string, state: { setActivePane: (p: any) => void; setSearchState: (u: any) => void }): CopilotResponse {
  const lower = input.toLowerCase().trim();
  const actions: Action[] = [];

  // ── Search intent ──
  if (lower.includes('find') || lower.includes('search') || lower.includes('show')) {
    // Detect vertical from known terms
    const verticals: [string, RegExp[]][] = [
      ['slurry_processing', [/slurry/, /concrete slurry/]],
      ['concrete', [/concrete(?! slurry)/]],
      ['grease_trap', [/grease trap/, /grease/]],
      ['hydro_excavation', [/hydro.?excavat/, /vac truck/, /vacuum truck/]],
      ['asbestos_abatement', [/asbestos/]],
      ['medical_waste', [/medical waste/]],
      ['industrial_wastewater', [/wastewater/, /industrial water/]],
      ['scrap_metal', [/scrap metal/, /scrap/]],
      ['tank_testing', [/tank test/]],
      ['stormwater_compliance', [/stormwater/, /storm water/]],
      ['dewatering', [/dewatering/, /de-water/]],
      ['marine_construction', [/marine/]],
      ['commercial_roofing', [/roof/]],
      ['fire_sprinkler', [/sprinkler/]],
      ['fire_extinguisher', [/extinguisher/]],
      ['hvac_balance', [/hvac/, /air balance/]],
      ['generator_testing', [/generator/]],
      ['elevator_inspection', [/elevator/]],
      ['backflow_testing', [/backflow/]],
      ['kitchen_exhaust', [/exhaust/, /kitchen hood/]],
      ['hazardous_soil_remediation', [/hazardous soil/, /soil remediation/, /contaminated/]],
      ['wind_infrastructure', [/wind/, /turbine/]],
    ];

    let matchedVertical = '';
    for (const [id, patterns] of verticals) {
      if (patterns.some(p => p.test(lower))) {
        matchedVertical = id;
        break;
      }
    }

    // Detect mode
    const isDisposal = lower.includes('disposal') || lower.includes('dump') || lower.includes('tip') || lower.includes('transfer station') || lower.includes('recycling');
    const targetMode = isDisposal ? 'disposal' : 'labor';
    actions.push({ icon: '📋', text: `Switched to ${targetMode === 'disposal' ? 'Disposal' : 'Labor'} mode`, done: true });
    state.setActivePane(targetMode);

    if (matchedVertical) {
      actions.push({ icon: '🎯', text: `Vertical: ${matchedVertical.replace(/_/g, ' ')}`, done: true });
      state.setSearchState((p: any) => ({ ...p, vertical: matchedVertical }));
    }

    // Detect location → zip
    for (const [city, zip] of Object.entries(CITY_ZIPS)) {
      if (lower.includes(city)) {
        actions.push({ icon: '📍', text: `Zip: ${zip} (${city.charAt(0).toUpperCase() + city.slice(1)})`, done: true });
        break;
      }
    }

    // Detect radius
    const radiusMatch = lower.match(/(\d+)\s*miles?/);
    if (radiusMatch) {
      actions.push({ icon: '📏', text: `Radius: ${radiusMatch[1]} mi`, done: true });
    } else {
      actions.push({ icon: '📏', text: 'Radius: 25 mi (default)', done: true });
    }

    actions.push({ icon: '🚀', text: 'Running search...' });
    return { message: 'Configured search parameters. Executing...', actions };
  }

  // ── Radius intent ──
  const radiusChange = lower.match(/(?:increase|expand|set|change)\s+(?:radius|range|search)\s+(?:to\s+)?(\d+)\s*miles?/);
  if (radiusChange) {
    actions.push({ icon: '📏', text: `Radius updated to ${radiusChange[1]} mi`, done: true });
    return { message: 'Radius adjusted.', actions };
  }

  // ── Language intent ──
  const langMatch = lower.match(/translate\s+(?:to\s+)?(\w+)/);
  if (langMatch) {
    const lang = langMatch[1].toLowerCase();
    actions.push({ icon: '🌐', text: `Language set to ${lang}`, done: true });
    return { message: 'Language updated.', actions };
  }

  // ── Logistics intent ──
  const volMatch = lower.match(/(\d[\d,]*)\s*(?:gal|gallon)/);
  if (volMatch || lower.includes('hauling') || lower.includes('logistics') || lower.includes('estimate')) {
    state.setActivePane('disposal');
    actions.push({ icon: '📋', text: 'Switched to Disposal mode', done: true });
    if (volMatch) {
      const vol = parseInt(volMatch[1].replace(/,/g, ''));
      actions.push({ icon: '🛢️', text: `Volume: ${vol.toLocaleString()} gal`, done: true });
    } else {
      actions.push({ icon: '🛢️', text: 'Volume: default', done: true });
    }
    return { message: 'Ready for logistics estimate.', actions };
  }

  // ── Bid intent ──
  if (lower.includes('bid') || lower.includes('proposal') || lower.includes('rfp') || lower.includes('scope')) {
    state.setActivePane('bids');
    actions.push({ icon: '📋', text: 'Switched to Bids mode', done: true });
    actions.push({ icon: '📄', text: 'Ready to accept scope / RFP upload', done: true });
    return { message: 'Bid mode ready. Upload a scope or RFP to begin.', actions };
  }

  return { message: `I don't understand that yet. Try: "Find slurry disposal near Fremont" or "Estimate hauling cost for 4500 gal"` };
}

export default function CopilotDrawer() {
  const { t } = useLanguage();
  const { activePane, setActivePane, setSearchState } = useSearchState();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CopilotMode>('search');
  const [input, setInput] = useState('');
  const [responses, setResponses] = useState<CopilotResponse[]>([]);
  const [executing, setExecuting] = useState(false);

  const modeMeta = MODE_META[mode];
  const AccentIcon = modeMeta.icon;

  const handleSubmit = useCallback(() => {
    if (!input.trim() || executing) return;
    setInput('');
    setExecuting(true);

    const res = parseAndExecute(input, { setActivePane, setSearchState });
    setResponses(prev => [...prev, { message: input, isUser: true } as any, res]);
    setExecuting(false);
  }, [input, executing, setActivePane, setSearchState]);

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-[60] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'var(--color-red)', border: 'none', cursor: 'pointer' }}
        data-agent-intent="open-copilot"
      >
        <Bot className="w-7 h-7 text-white" />
      </button>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-[60] h-full w-full max-w-md transition-transform duration-300 shadow-2xl"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
        }}
        data-agent-context="copilot-drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-red) 12%, transparent)' }}>
              <Bot className="w-5 h-5" style={{ color: 'var(--color-red)' }} />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>HHR Copilot</div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--color-muted)' }}>{modeMeta.label}</div>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-surface)', cursor: 'pointer', border: 'none' }}>
            <X className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          </button>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2 px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {(Object.entries(MODE_META) as [CopilotMode, typeof MODE_META['search']][]).map(([key, meta]) => {
            const Icon = meta.icon;
            const isActive = mode === key;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: isActive ? `color-mix(in srgb, ${meta.accent} 10%, transparent)` : 'var(--color-surface2)',
                  color: isActive ? meta.accent : 'var(--color-muted)',
                  border: isActive ? `1px solid ${meta.accent}` : '1px solid transparent',
                  cursor: 'pointer',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {meta.label.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {responses.length === 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('suggestions')}</div>
              {SUGGESTIONS.filter(s => s.mode === mode).map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const res = parseAndExecute(s.text, { setActivePane, setSearchState });
                    setResponses(prev => [...prev, { message: s.text, isUser: true } as any, res]);
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2"
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                >
                  {s.text}
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-muted)' }} />
                </button>
              ))}
            </div>
          )}

          {responses.map((r, i) => {
            if ((r as any).isUser) {
              return (
                <div key={i} className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'color-mix(in srgb, var(--color-red) 6%, var(--color-surface2))',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-red)' }}>{t('you')}</span>
                  </div>
                  {r.message}
                </div>
              );
            }

            const response = r as CopilotResponse;
            return (
              <div key={i} className="space-y-2">
                {response.actions ? (
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'color-mix(in srgb, var(--color-blue) 8%, var(--color-surface2))',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4" style={{ color: 'var(--color-blue)' }} />
                      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-blue)' }}>HHR Copilot</span>
                    </div>
                    <div className="space-y-1.5">
                      {response.actions.map((action, ai) => (
                        <div key={ai} className="flex items-center gap-2 text-xs">
                          <span>{action.done ? <Check className="w-3 h-3" style={{ color: 'var(--color-green)' }} /> : <span className="w-3 h-3 inline-block" style={{ color: 'var(--color-muted)' }}>○</span>}</span>
                          <span style={{ color: action.done ? 'var(--color-green)' : 'var(--color-muted)' }}>
                            {action.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'color-mix(in srgb, var(--color-yellow) 8%, var(--color-surface2))',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    <Bot className="w-4 h-4 inline mr-1.5" style={{ color: 'var(--color-yellow)' }} />
                    {response.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={t('ask hhr copilot...')}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none px-2"
              style={{ color: 'var(--color-text)' }}
              data-agent-intent="copilot-chat-input"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || executing}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: input.trim() && !executing ? 'var(--color-red)' : 'var(--color-border)',
                cursor: input.trim() && !executing ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
