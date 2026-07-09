'use client';

import { useState, useEffect } from 'react';
import { Phone, Mail, Linkedin, FileText, Clock, Plus, RefreshCw } from 'lucide-react';

interface OutreachEntry {
  id: string;
  company_id?: string;
  contact_id?: string;
  interaction_type: 'CALL' | 'EMAIL' | 'LINKEDIN' | 'NOTE';
  outcome: string;
  notes?: string;
  created_at: string;
}

const interactionIcons: Record<string, typeof Phone> = {
  CALL: Phone,
  EMAIL: Mail,
  LINKEDIN: Linkedin,
  NOTE: FileText,
};

const interactionColors: Record<string, string> = {
  CALL: 'var(--color-green)',
  EMAIL: 'var(--color-blue)',
  LINKEDIN: 'var(--color-blue)',
  NOTE: 'var(--color-muted)',
};

export default function OutreachPage() {
  const [entries, setEntries] = useState<OutreachEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogForm, setShowLogForm] = useState(false);
  const [form, setForm] = useState({
    companyId: '',
    contactId: '',
    interactionType: 'NOTE' as OutreachEntry['interaction_type'],
    outcome: '',
    notes: '',
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    try {
      const res = await fetch('/api/outreach/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: '00000000-0000-0000-0000-000000000000' }),
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.history || []);
      }
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }

  async function handleLogOutreach(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/outreach/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: form.companyId || '00000000-0000-0000-0000-000000000000',
          contactId: form.contactId || undefined,
          interactionType: form.interactionType,
          outcome: form.outcome,
          notes: form.notes,
        }),
      });
      if (res.ok) {
        setShowLogForm(false);
        setForm({ companyId: '', contactId: '', interactionType: 'NOTE', outcome: '', notes: '' });
        fetchEntries();
      }
    } catch {
      /* silently fail */
    }
  }

  function TypeIcon({ type }: { type: string }) {
    const Icon = interactionIcons[type] || FileText;
    return <Icon className="w-4 h-4" />;
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            Outreach Log
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Track calls, emails, and interactions across your pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntries}
            className="rounded-lg p-2.5 transition-all"
            style={{ background: 'var(--color-surface2)' }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          </button>
          <button
            onClick={() => setShowLogForm(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm text-white transition-all"
            style={{ background: 'var(--color-red)' }}
          >
            <Plus className="w-4 h-4" />
            Log Interaction
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center" style={{ color: 'var(--color-muted)' }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div
          className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Phone className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
          <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>No outreach logged yet</div>
          <div className="text-sm max-w-md" style={{ color: 'var(--color-muted)' }}>
            Start logging calls, emails, and interactions to track your pipeline engagement.
          </div>
          <button
            onClick={() => setShowLogForm(true)}
            className="mt-6 flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm text-white transition-all"
            style={{ background: 'var(--color-red)' }}
          >
            <Plus className="w-4 h-4" />
            Log First Interaction
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => {
            const Icon = interactionIcons[entry.interaction_type] || FileText;
            const color = interactionColors[entry.interaction_type] || 'var(--color-muted)';
            return (
              <div
                key={entry.id}
                className="rounded-xl p-5 flex items-start gap-4"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                      {entry.interaction_type}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}>
                      {entry.outcome}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="mt-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>{entry.notes}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
                    <Clock className="w-3 h-3" />
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showLogForm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowLogForm(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-8 relative"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-black mb-6" style={{ color: 'var(--color-text)' }}>
              Log Outreach Interaction
            </h2>

            <form onSubmit={handleLogOutreach} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-muted)' }}>
                  Type
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(['CALL', 'EMAIL', 'LINKEDIN', 'NOTE'] as const).map(type => {
                    const BtnIcon = interactionIcons[type];
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, interactionType: type }))}
                        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
                        style={{
                          background: form.interactionType === type ? 'var(--color-red)' : 'var(--color-surface2)',
                          color: form.interactionType === type ? 'white' : 'var(--color-muted)',
                        }}
                      >
                        <BtnIcon className="w-4 h-4" />
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-muted)' }}>
                  Outcome
                </label>
                <input
                  value={form.outcome}
                  onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                  placeholder="e.g. Left voicemail, Sent proposal, Called back"
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{
                    background: 'var(--color-surface2)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-muted)' }}>
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Add notes about this interaction..."
                  rows={3}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
                  style={{
                    background: 'var(--color-surface2)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogForm(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-all"
                  style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
                  style={{ background: 'var(--color-red)' }}
                >
                  Log Interaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
