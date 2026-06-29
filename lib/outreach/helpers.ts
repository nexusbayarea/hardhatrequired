import { logger } from '@/lib/logger';
import { supabaseRpc, supabaseFetch } from '@/lib/db';

const inMemoryLogs: any[] = [];

export async function logOutreach(params: {
  organizationId: string;
  companyId: string;
  contactId?: string;
  interactionType: 'CALL' | 'EMAIL' | 'LINKEDIN' | 'NOTE';
  outcome: string;
  notes?: string;
}): Promise<any> {
  const entry = {
    id: `outreach-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...params,
    createdAt: new Date().toISOString()
  };

  try {
    const res = await supabaseRpc('log_outreach_interaction', {
      p_org_id: params.organizationId,
      p_company_id: params.companyId,
      p_contact_id: params.contactId || null,
      p_interaction_type: params.interactionType,
      p_outcome: params.outcome,
      p_notes: params.notes || null
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    logger.error('Outreach log DB failed', { route: 'outreach/helpers', error: String(err) });
  }

  inMemoryLogs.unshift(entry);
  return entry;
}

export async function getCompanyOutreach(companyId: string): Promise<any[]> {
  try {
    const res = await supabaseFetch(
      `/rest/v1/outreach_logs?company_id=eq.${companyId}&order=created_at.desc`
    );
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    logger.error('Outreach get DB failed', { route: 'outreach/helpers', error: String(err) });
  }

  return inMemoryLogs.filter(l => l.companyId === companyId);
}
