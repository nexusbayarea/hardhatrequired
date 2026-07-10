'use client';

import { useEffect, useState } from 'react';
import { Plus, Play, Pause, RefreshCw, Target, Clock } from 'lucide-react';

interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  verticalSlug: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  targetCount: number;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'var(--color-muted)',
  ACTIVE: 'var(--color-green)',
  PAUSED: 'var(--color-amber)',
  COMPLETED: 'var(--color-blue)',
};

const statusBgColors: Record<string, string> = {
  DRAFT: 'var(--color-surface2)',
  ACTIVE: 'color-mix(in srgb, var(--color-green) 15%, transparent)',
  PAUSED: 'color-mix(in srgb, var(--color-amber) 15%, transparent)',
  COMPLETED: 'color-mix(in srgb, var(--color-blue) 15%, transparent)',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createVertical, setCreateVertical] = useState('concrete_heavy_civil');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: createName, verticalSlug: createVertical }),
      });
      if (res.ok) {
        setShowCreate(false);
        setCreateName('');
        fetchCampaigns();
      }
    } catch {
      /* silently fail */
    }
  }

  async function toggleStatus(campaign: Campaign) {
    const action = campaign.status === 'ACTIVE' ? 'pause' : 'start';
    try {
      await fetch(`/api/campaigns/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id }),
      });
      fetchCampaigns();
    } catch {
      /* silently fail */
    }
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            Campaigns
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            Manage outreach campaigns across verticals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCampaigns}
            className="rounded-lg p-2.5 transition-all"
            style={{ background: 'var(--color-surface2)' }}
          >
            <RefreshCw className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-sm text-white transition-all"
            style={{ background: 'var(--color-red)' }}
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center" style={{ color: 'var(--color-muted)' }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div
          className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Target className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
          <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>No campaigns yet</div>
          <div className="text-sm max-w-md" style={{ color: 'var(--color-muted)' }}>
            Create your first campaign to start tracking outreach and engagement.
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 flex items-center gap-2 rounded-xl px-5 py-3 font-semibold text-sm text-white transition-all"
            style={{ background: 'var(--color-red)' }}
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {campaigns.map(campaign => (
            <div
              key={campaign.id}
              className="rounded-xl p-5"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{campaign.name}</h3>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                      style={{
                        background: statusBgColors[campaign.status] || 'var(--color-surface2)',
                        color: statusColors[campaign.status] || 'var(--color-muted)',
                      }}
                    >
                      {campaign.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm" style={{ color: 'var(--color-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {campaign.targetCount} targets
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {(campaign.status === 'DRAFT' || campaign.status === 'PAUSED') && (
                    <button
                      onClick={() => toggleStatus(campaign)}
                      className="rounded-lg p-2 transition-all"
                      style={{ background: statusBgColors.ACTIVE }}
                      title="Start campaign"
                    >
                      <Play className="w-4 h-4" style={{ color: 'var(--color-green)' }} />
                    </button>
                  )}
                  {campaign.status === 'ACTIVE' && (
                    <button
                      onClick={() => toggleStatus(campaign)}
                      className="rounded-lg p-2 transition-all"
                      style={{ background: statusBgColors.PAUSED }}
                      title="Pause campaign"
                    >
                      <Pause className="w-4 h-4" style={{ color: 'var(--color-amber)' }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl p-8 relative"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-black mb-6" style={{ color: 'var(--color-text)' }}>
              New Campaign
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--color-muted)' }}>
                  Campaign Name
                </label>
                <input
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  placeholder="e.g. Q3 Slurry Outreach"
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
                  Vertical
                </label>
                <select
                  value={createVertical}
                  onChange={e => setCreateVertical(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
                  style={{
                    background: 'var(--color-surface2)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <option value="concrete_heavy_civil">Concrete / Heavy Civil</option>
                  <option value="demolition_excavation">Demolition & Excavation</option>
                  <option value="utility_infrastructure">Utility / Infrastructure</option>
                  <option value="road_highway">Road & Highway</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
