import { logger } from '@/lib/logger';
import { supabaseFetch } from '@/lib/db';

export interface Campaign {
  id: string;
  organizationId: string;
  name: string;
  verticalSlug: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  targetCount: number;
  createdAt: string;
  updatedAt: string;
}

const inMemoryStore: Campaign[] = [];

export async function createCampaign(params: {
  organizationId: string;
  name: string;
  verticalSlug: string;
}): Promise<Campaign> {
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: `camp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    organizationId: params.organizationId,
    name: params.name,
    verticalSlug: params.verticalSlug,
    status: 'DRAFT',
    targetCount: 0,
    createdAt: now,
    updatedAt: now
  };

  try {
    const res = await supabaseFetch('/rest/v1/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        organization_id: params.organizationId,
        name: params.name,
        vertical_slug: params.verticalSlug,
        status: 'DRAFT'
      })
    });

    if (res.ok) {
      const data = await res.json();
      return data[0] ? {
        id: data[0].id,
        organizationId: data[0].organization_id,
        name: data[0].name,
        verticalSlug: data[0].vertical_slug || params.verticalSlug,
        status: data[0].status || 'DRAFT',
        targetCount: data[0].target_count || 0,
        createdAt: data[0].created_at,
        updatedAt: data[0].updated_at
      } : campaign;
    }
  } catch (err) {
    logger.error('Campaign DB create failed', { route: 'campaign/helpers', error: String(err) });
  }

  inMemoryStore.push(campaign);
  return campaign;
}

export async function listCampaigns(organizationId: string): Promise<Campaign[]> {
  try {
    const res = await supabaseFetch(
      `/rest/v1/campaigns?organization_id=eq.${organizationId}&order=created_at.desc`
    );
    if (res.ok) {
      const data = await res.json();
      return (data || []).map((row: any) => ({
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        verticalSlug: row.vertical_slug || '',
        status: row.status || 'DRAFT',
        targetCount: row.target_count || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    }
  } catch (err) {
    logger.error('Campaign list DB failed', { route: 'campaign/helpers', error: String(err) });
  }

  return inMemoryStore.filter(c => c.organizationId === organizationId);
}

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  try {
    const res = await supabaseFetch(`/rest/v1/campaigns?id=eq.${campaignId}`);
    if (res.ok) {
      const data = await res.json();
      if (data[0]) {
        return {
          id: data[0].id,
          organizationId: data[0].organization_id,
          name: data[0].name,
          verticalSlug: data[0].vertical_slug || '',
          status: data[0].status || 'DRAFT',
          targetCount: data[0].target_count || 0,
          createdAt: data[0].created_at,
          updatedAt: data[0].updated_at
        };
      }
    }
  } catch (err) {
    logger.error('Campaign get DB failed', { route: 'campaign/helpers', error: String(err) });
  }

  return inMemoryStore.find(c => c.id === campaignId) || null;
}

export async function updateCampaignStatus(campaignId: string, status: Campaign['status']): Promise<boolean> {
  const campaign = inMemoryStore.find(c => c.id === campaignId);
  if (campaign) {
    campaign.status = status;
    campaign.updatedAt = new Date().toISOString();
  }

  try {
    const res = await supabaseFetch(`/rest/v1/campaigns?id=eq.${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() })
    });
    return res.ok;
  } catch {
    return true;
  }
}
