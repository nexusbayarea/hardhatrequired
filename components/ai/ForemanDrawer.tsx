'use client';

import { useState, useCallback, useEffect } from 'react';
import { Bot, X, Truck, FileText, Search, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { foremanStore, useForemanStore } from '@/stores/foreman.store';

type ForemanMode = 'search' | 'logistics' | 'bid';

const SUGGESTIONS: Record<ForemanMode, string[]> = {
  search: [
    'Find slurry disposal near Fremont',
    'Show direct operators only',
    'Increase radius to 50 miles',
    'Translate results to Chinese',
  ],
  logistics: [
    'Estimate hauling cost for 4500 gal',
  ],
  bid: [
    'Help me bid this project',
  ],
};

const MODE_META: Record<ForemanMode, { icon: typeof Search; label: string; accent: string }> = {
  search: { icon: Search, label: 'Search Mode', accent: 'var(--color-red)' },
  logistics: { icon: Truck, label: 'Logistics Mode', accent: 'var(--color-green)' },
  bid: { icon: FileText, label: 'Bid Mode', accent: 'var(--color-yellow)' },
};

export default function ForemanDrawer() {
  const { t } = useLanguage();
  const { messages, isExecuting, open } = useForemanStore();
  const [mode, setMode] = useState<ForemanMode>('search');
  const [input, setInput] = useState('');

  useEffect(() => {
    const onOpenForeman = () => foremanStore.setState({ open: true });
    window.addEventListener('open-foreman', onOpenForeman);
    return () => window.removeEventListener('open-foreman', onOpenForeman);
  }, []);

  const modeMeta = MODE_META[mode];
  const AccentIcon = modeMeta.icon;

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isExecuting) return;
    const text = input;
    setInput('');

    foremanStore.setState({ open: true });
    const msgs = foremanStore.getState().messages;
    foremanStore.setState({
      messages: [...msgs, { id: `msg-${Date.now()}`, text, isUser: true }],
      isExecuting: true,
    });

    fetch('/api/foreman', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    })
      .then(r => r.json())
      .then(data => {
        const msgs = foremanStore.getState().messages;
        foremanStore.setState({
          messages: [
            ...msgs,
            {
              id: `msg-${Date.now()}`,
              text: data.message || '',
              isUser: false,
              actions: data.actions ?? [],
              intent: data.intent,
              done: true,
            },
          ],
          isExecuting: false,
        });
      })
      .catch(err => {
        const msgs = foremanStore.getState().messages;
        foremanStore.setState({
          messages: [
            ...msgs,
            { id: `msg-${Date.now()}`, text: `Error: ${err.message}`, isUser: false, done: true },
          ],
          isExecuting: false,
        });
      });
  }, [input, isExecuting]);

  return (
    <>
      <button
        onClick={() => foremanStore.setState({ open: true })}
        className="fixed bottom-20 right-6 z-[60] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'var(--color-red)', border: 'none', cursor: 'pointer' }}
        data-agent-intent="open-foreman"
      >
        <Bot className="w-7 h-7 text-white" />
      </button>

      {open && <div className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm" onClick={() => foremanStore.setState({ open: false })} />}

      <div
        className="fixed top-0 right-0 z-[60] h-full w-full max-w-md transition-transform duration-300 shadow-2xl"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
        }}
        data-agent-context="foreman-drawer"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--color-red) 12%, transparent)' }}>
              <Bot className="w-5 h-5" style={{ color: 'var(--color-red)' }} />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Foreman</div>
              <div className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>{modeMeta.label}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={() => foremanStore.setState({ messages: [], isExecuting: false })}
                className="text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg"
                style={{ color: 'var(--color-muted)', background: 'var(--color-surface)', cursor: 'pointer', border: 'none' }}
              >
                Clear
              </button>
            )}
            <button onClick={() => foremanStore.setState({ open: false })} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-surface)', cursor: 'pointer', border: 'none' }}>
              <X className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {(Object.entries(MODE_META) as [ForemanMode, typeof MODE_META['search']][]).map(([key, meta]) => {
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

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ maxHeight: 'calc(100vh - 260px)' }}>
          {messages.length === 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('suggestions')}</div>
              {SUGGESTIONS[mode].map((text, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput('');
                    const msgs = foremanStore.getState().messages;
                    foremanStore.setState({
                      messages: [...msgs, { id: `msg-${Date.now()}`, text, isUser: true }],
                      isExecuting: true,
                    });
                    fetch('/api/foreman', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ message: text }),
                    })
                      .then(r => r.json())
                      .then(data => {
                        const msgs = foremanStore.getState().messages;
                        foremanStore.setState({
                          messages: [...msgs, {
                            id: `msg-${Date.now()}`, text: data.message || '', isUser: false,
                            actions: data.actions ?? [], intent: data.intent, done: true,
                          }],
                          isExecuting: false,
                        });
                      })
                      .catch(() => foremanStore.setState({ isExecuting: false }));
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between gap-2"
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                >
                  {text}
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--color-muted)' }} />
                </button>
              ))}
            </div>
          )}

          {messages.map((msg) => {
            if (msg.isUser) {
              return (
                <div key={msg.id} className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: 'color-mix(in srgb, var(--color-red) 6%, var(--color-surface2))',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-red)' }}>{t('you')}</span>
                  </div>
                  {msg.text}
                </div>
              );
            }

            return (
              <div key={msg.id} className="space-y-2">
                {msg.actions && msg.actions.length > 0 ? (
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
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-blue)' }}>Foreman</span>
                      {msg.intent && (
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                          {msg.intent}
                        </span>
                      )}
                    </div>
                    {msg.text && (
                      <div className="text-xs mb-2" style={{ color: 'var(--color-muted)' }}>{msg.text}</div>
                    )}
                    <div className="space-y-1.5">
                      {msg.actions.map((action, ai) => (
                        <div key={ai} className="flex items-center gap-2 text-xs">
                          <span>{msg.done ? <Check className="w-3 h-3" style={{ color: 'var(--color-green)' }} /> : <Loader2 className="w-3 h-3 animate-spin" style={{ color: 'var(--color-muted)' }} />}</span>
                          <span style={{ color: msg.done ? 'var(--color-green)' : 'var(--color-muted)' }}>
                            {actionLabel(action)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className="px-4 py-3 rounded-xl text-sm"
                    style={{
                      background: 'color-mix(in srgb, var(--color-blue) 8%, var(--color-surface2))',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  >
                    <Bot className="w-4 h-4 inline mr-1.5" style={{ color: 'var(--color-blue)' }} />
                    {msg.text}
                  </div>
                )}
              </div>
            );
          })}

          {isExecuting && (
            <div className="flex items-center gap-2 px-4 py-3 text-xs" style={{ color: 'var(--color-muted)' }}>
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2 p-2 rounded-xl" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={t('ask foreman...')}
              className="flex-1 bg-transparent text-sm font-medium focus:outline-none px-2"
              style={{ color: 'var(--color-text)' }}
              data-agent-intent="foreman-chat-input"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isExecuting}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: input.trim() && !isExecuting ? 'var(--color-red)' : 'var(--color-border)',
                cursor: input.trim() && !isExecuting ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              {isExecuting ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function actionLabel(action: any): string {
  switch (action.type) {
    case 'setWorkspace': return `Switched to ${action.value} workspace`;
    case 'setMode': return `Mode: ${action.value}`;
    case 'setVertical': return `Vertical: ${action.value.replace(/_/g, ' ')}`;
    case 'setZip': return `Zip: ${action.value}`;
    case 'setRadius': return `Radius: ${action.value} mi`;
    case 'setGallons': return `Volume: ${action.value?.toLocaleString()} gal`;
    case 'searchResults': return `Found ${action.count} results`;
    case 'click': return `Clicked ${action.target}`;
    case 'showNotification': return action.message;
    case 'navigate': return `Navigating to ${action.route}`;
    default: return action.type;
  }
}
