import { logger } from '@/lib/logger';
import { supabaseRpc, supabaseFetch } from '@/lib/db';

export async function logOutreach(params: {
  organizationId: string;
  companyId: string;
  contactId?: string;
  interactionType: 'CALL' | 'EMAIL' | 'LINKEDIN' | 'NOTE';
  outcome: string;
  notes?: string;
}): Promise<any> {
  try {
    const res = await supabaseRpc('log_outreach_interaction', {
      p_org_id: params.organizationId,
      p_company_id: params.companyId,
      p_contact_id: params.contactId || null,
      p_interaction_type: params.interactionType,
      p_outcome: params.outcome,
      p_notes: params.notes || null
    });

    if (!res.ok) {
      logger.error('Outreach log DB failed', { route: 'outreach/helpers', data: { status: res.status } });
      return null;
    }

    return await res.json();
  } catch (err) {
    logger.error('Outreach log DB failed', { route: 'outreach/helpers', error: String(err) });
    return null;
  }
}

export async function getCompanyOutreach(companyId: string): Promise<any[]> {
  try {
    const res = await supabaseFetch(
      `/rest/v1/outreach_logs?company_id=eq.${companyId}&order=created_at.desc`
    );
    if (!res.ok) return [];

    return await res.json();
  } catch (err) {
    logger.error('Outreach get DB failed', { route: 'outreach/helpers', error: String(err) });
    return [];
  }
}
