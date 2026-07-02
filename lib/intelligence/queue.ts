import { supabaseFetch } from '@/lib/db';
import { ScrapeJob, JobPriority } from './types';

export async function enqueueScrape(params: {
  canonicalKey: string;
  companyName?: string;
  domain?: string;
  vertical: string;
  priority?: JobPriority;
  triggerReason?: string;
}): Promise<boolean> {
  try {
    const body = {
      canonical_key: params.canonicalKey,
      company_name: params.companyName || null,
      domain: params.domain || null,
      vertical: params.vertical,
      status: 'pending',
      priority: params.priority || 'medium',
      trigger_reason: params.triggerReason || null,
    };
    const res = await supabaseFetch('/rest/v1/scrape_jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function claimNextJob(): Promise<ScrapeJob | null> {
  try {
    const res = await supabaseFetch('/rest/v1/rpc/claim_scrape_job', { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateJobStatus(
  id: string,
  status: 'running' | 'complete' | 'failed',
  error?: string
): Promise<boolean> {
  try {
    const body: Record<string, string | number | null> = { status };
    if (status === 'running') body.started_at = new Date().toISOString();
    if (status === 'complete') body.completed_at = new Date().toISOString();
    if (error) body.error = error;

    const res = await supabaseFetch(
      `/rest/v1/scrape_jobs?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function queueBackgroundRefresh(
  canonicalKey: string,
  vertical: string,
  priority: JobPriority = 'low'
): Promise<void> {
  await enqueueScrape({ canonicalKey, vertical, priority, triggerReason: 'background_refresh' });
}
