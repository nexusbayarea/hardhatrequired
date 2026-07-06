'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ArrowRight, Calendar, Loader, Building2 } from 'lucide-react';

interface Alert {
  facility_name: string;
  city: string;
  county: string;
  permit_status: string;
  regulatory_status: string;
  vertical: string;
  confidence: string;
  imported_at: string;
}

export default function ComplianceAlertStrip() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetch('/api/public/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.alerts?.length) {
          setAlerts(data.alerts);
          setHasData(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!hasData && !loading) return null;

  if (loading) {
    return (
      <section className="py-24 md:py-36">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 flex items-center justify-center p-12">
          <Loader className="w-6 h-6 animate-spin" style={{ color: 'var(--color-red)' }} />
        </div>
      </section>
    );
  }

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <section className="py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="mb-12">
          <p className="section-label mb-4">regulatory monitoring</p>
          <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
            stay ahead of<br />
            <span style={{ color: 'var(--color-muted)' }}>regulatory changes.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert, idx) => {
            const isExpanded = expanded === idx;
            const isActive = alert.permit_status === 'Active';
            return (
              <div
                key={idx}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: isActive
                    ? 'color-mix(in srgb, var(--color-green) 4%, var(--color-surface))'
                    : 'color-mix(in srgb, var(--color-red) 4%, var(--color-surface))',
                  border: `1px solid color-mix(in srgb, ${isActive ? 'var(--color-green)' : 'var(--color-red)'} 15%, var(--color-border))`,
                }}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : idx)}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isActive
                          ? 'color-mix(in srgb, var(--color-green) 12%, transparent)'
                          : 'color-mix(in srgb, var(--color-red) 12%, transparent)',
                      }}
                    >
                      <Building2 className="w-5 h-5" style={{ color: isActive ? 'var(--color-green)' : 'var(--color-red)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isActive ? 'var(--color-green)' : 'var(--color-red)' }}>
                          {alert.vertical?.replace(/_/g, ' ') || 'Facility'}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                          background: isActive
                            ? 'color-mix(in srgb, var(--color-green) 12%, transparent)'
                            : 'color-mix(in srgb, var(--color-red) 12%, transparent)',
                          color: isActive ? 'var(--color-green)' : 'var(--color-red)',
                        }}>
                          {alert.permit_status || alert.regulatory_status || 'Unknown'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                        {alert.facility_name}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                        <span>{alert.city}{alert.city && alert.county ? ', ' : ''}{alert.county}</span>
                        {alert.imported_at && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(alert.imported_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {!isActive && <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: 'var(--color-yellow)' }} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5">
                    <div className="pl-14 space-y-2">
                      <div
                        className="p-3 rounded-lg flex items-start gap-2"
                        style={{
                          background: isActive
                            ? 'color-mix(in srgb, var(--color-green) 6%, var(--color-surface2))'
                            : 'color-mix(in srgb, var(--color-red) 6%, var(--color-surface2))',
                          border: `1px solid color-mix(in srgb, ${isActive ? 'var(--color-green)' : 'var(--color-red)'} 15%, var(--color-border))`,
                        }}
                      >
                        <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" style={{ color: isActive ? 'var(--color-green)' : 'var(--color-red)' }} />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: isActive ? 'var(--color-green)' : 'var(--color-red)' }}>
                            {isActive ? 'Active Facility' : 'Regulatory Status'}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            {alert.regulatory_status || alert.permit_status || 'Status unknown'} · Confidence: {alert.confidence || 'N/A'}
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

        {hasData && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
              Monitor {alerts.length} regulatory facilities
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
          </div>
        )}
      </div>
    </section>
  );
}
