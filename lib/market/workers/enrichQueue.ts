import { Client } from '@upstash/qstash';

const QSTASH_TOKEN = process.env.QSTASH_TOKEN || process.env.UPSTASH_QSTASH_TOKEN;
const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_BASE_URL || '';

function getClient() {
  if (!QSTASH_TOKEN) return null;
  return new Client({ token: QSTASH_TOKEN });
}

export function qstashAvailable(): boolean {
  return !!QSTASH_TOKEN && !!BASE_URL;
}

export async function enqueueEnrichment(
  companyId: string,
  website: string,
  verticalId: string,
  searchZip: string
): Promise<boolean> {
  const client = getClient();
  if (!client || !BASE_URL) return false;

  try {
    await client.publishJSON({
      url: `${BASE_URL}/api/enrich/scrape`,
      body: { companyId, url: website, verticalId, searchZip },
      retries: 2,
    });
    return true;
  } catch (err) {
    console.warn(`[enrichQueue] Failed to enqueue ${companyId}:`, err);
    return false;
  }
}

export async function enqueueBatch(
  companies: { id: string; website: string | null }[],
  verticalId: string,
  searchZip: string
): Promise<number> {
  const withWebsites = companies.filter(c => c.website);
  let enqueued = 0;

  for (const company of withWebsites) {
    const ok = await enqueueEnrichment(company.id, company.website!, verticalId, searchZip);
    if (ok) enqueued++;
  }

  return enqueued;
}

export async function scrapeDirect(
  companyId: string,
  website: string,
  verticalId: string,
  searchZip: string
): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/api/enrich/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, url: website, verticalId, searchZip }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
