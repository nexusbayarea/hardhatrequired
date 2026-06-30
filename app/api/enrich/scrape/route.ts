import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@upstash/qstash';
import { scrapeCompanyWebsite } from '@/lib/market/workers/enrichmentScraper';
import { redis } from '@/lib/redis';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, url, verticalId, searchZip } = body;

    if (!url || !verticalId) {
      return NextResponse.json({ error: 'Missing url or verticalId' }, { status: 400 });
    }

    const config = VERTICAL_REGISTRY[verticalId];
    if (!config) {
      return NextResponse.json({ error: `Unknown vertical: ${verticalId}` }, { status: 400 });
    }

    const allKeywords = [
      ...config.signals.primary.map(s => s.term),
      ...config.signals.secondary.map(s => s.term),
      ...config.equipmentKeywords,
    ];

    const scrapeResult = await scrapeCompanyWebsite(url, allKeywords);

    const enrichment = {
      scrapedAt: new Date().toISOString(),
      ...scrapeResult,
    };

    if (redis) {
      const cacheKey = `enrich:${verticalId}:${companyId}`;
      await redis.set(cacheKey, enrichment, { ex: 86400 });
    }

    return NextResponse.json({ success: true, enrichment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  const verticalId = searchParams.get('verticalId');

  if (!companyId || !verticalId || !redis) {
    return NextResponse.json({ enrichment: null });
  }

  const cacheKey = `enrich:${verticalId}:${companyId}`;
  const cached = await redis.get(cacheKey);
  return NextResponse.json({ enrichment: cached || null });
}
