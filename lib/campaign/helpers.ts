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

export async function createCampaign(params: {
  organizationId: string;
  name: string;
  verticalSlug: string;
}): Promise<Campaign | null> {
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

    if (!res.ok) {
      logger.error('Campaign DB create failed', { route: 'campaign/helpers', data: { status: res.status } });
      return null;
    }

    const data = await res.json();
    if (!data[0]) return null;

    return {
      id: data[0].id,
      organizationId: data[0].organization_id,
      name: data[0].name,
      verticalSlug: data[0].vertical_slug || params.verticalSlug,
      status: data[0].status || 'DRAFT',
      targetCount: data[0].target_count || 0,
      createdAt: data[0].created_at,
      updatedAt: data[0].updated_at
    };
  } catch (err) {
    logger.error('Campaign DB create failed', { route: 'campaign/helpers', error: String(err) });
    return null;
  }
}

export async function listCampaigns(organizationId: string): Promise<Campaign[]> {
  try {
    const res = await supabaseFetch(
      `/rest/v1/campaigns?organization_id=eq.${organizationId}&order=created_at.desc`
    );
    if (!res.ok) return [];

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
  } catch (err) {
    logger.error('Campaign list DB failed', { route: 'campaign/helpers', error: String(err) });
    return [];
  }
}

export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  try {
    const res = await supabaseFetch(`/rest/v1/campaigns?id=eq.${campaignId}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data[0]) return null;

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
  } catch (err) {
    logger.error('Campaign get DB failed', { route: 'campaign/helpers', error: String(err) });
    return null;
  }
}

export async function updateCampaignStatus(campaignId: string, status: Campaign['status']): Promise<boolean> {
  try {
    const res = await supabaseFetch(`/rest/v1/campaigns?id=eq.${campaignId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() })
    });
    return res.ok;
  } catch (err) {
    logger.error('Campaign status update failed', { route: 'campaign/helpers', error: String(err) });
    return false;
  }
}
