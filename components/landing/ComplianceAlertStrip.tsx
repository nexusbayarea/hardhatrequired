'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, Calendar, Loader, Gavel } from 'lucide-react';

interface ComplianceRule {
  id: string;
  title: string;
  authority: string;
  effectiveDate: string;
  penaltyRisk: string;
  summary: string;
  requiredAction: string;
}

export default function ComplianceAlertStrip() {
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'CA' }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && data?.compliance?.length) {
          setRules(data.compliance);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-24 md:py-36">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 flex items-center justify-center p-12">
          <Loader className="w-6 h-6 animate-spin" style={{ color: 'var(--color-red)' }} />
        </div>
      </section>
    );
  }

  if (rules.length === 0) return null;

  return (
    <section className="py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="mb-12">
          <p className="section-label mb-4">compliance monitoring</p>
          <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
            stay ahead of<br />
            <span style={{ color: 'var(--color-muted)' }}>regulatory changes.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => {
            const isExpanded = expanded === rule.id;
            return (
              <div
                key={rule.id}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: 'color-mix(in srgb, var(--color-red) 4%, var(--color-surface))',
                  border: '1px solid color-mix(in srgb, var(--color-red) 15%, var(--color-border))',
                }}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : rule.id)}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'color-mix(in srgb, var(--color-red) 12%, transparent)' }}
                    >
                      <Gavel className="w-5 h-5" style={{ color: 'var(--color-red)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-red)' }}>
                          {rule.authority}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                          background: 'color-mix(in srgb, var(--color-red) 12%, transparent)',
                          color: 'var(--color-red)',
                        }}>
                          {rule.penaltyRisk}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        {rule.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Effective {rule.effectiveDate}
                        </span>
                      </div>
                    </div>
                    <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: 'var(--color-yellow)' }} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 animate-slide-down">
                    <div className="pl-14 space-y-3">
                      <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                        {rule.summary}
                      </p>
                      <div
                        className="p-3 rounded-lg flex items-start gap-2"
                        style={{ background: 'color-mix(in srgb, var(--color-green) 6%, var(--color-surface2))', border: '1px solid color-mix(in srgb, var(--color-green) 15%, var(--color-border))' }}
                      >
                        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--color-green)' }} />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: 'var(--color-green)' }}>
                            Required Action
                          </span>
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            {rule.requiredAction}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
            Monitor {rules.length} active compliance rules
          </span>
          <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
        </div>
      </div>
    </section>
  );
}
