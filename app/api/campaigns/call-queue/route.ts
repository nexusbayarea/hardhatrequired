import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { IndexIntelligenceEngine } from '@/lib/market/adapter';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const body = await req.json();
    const parsed = validate(z.object({
      campaignId: z.string(),
      verticalId: z.string().optional(),
      zip: z.string().optional(),
      radius: z.number().optional(),
    }), body);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { campaignId, verticalId = 'slurry_processing', zip = '94538', radius = 50 } = parsed.data!;

    const config = VERTICAL_REGISTRY[verticalId];
    if (!config) {
      return NextResponse.json({ error: `Unknown vertical: ${verticalId}` }, { status: 404 });
    }

    const engine = new IndexIntelligenceEngine();
    const { companies } = await engine.executeMarketDiscovery(
      { zip, radius, mode: 'labor' },
      config,
    );

    const queue = companies
      .filter(c => c.phone)
      .slice(0, 50)
      .map((c, idx) => ({
        companyId: c.id || `lead-${idx}`,
        companyName: c.companyName || 'Unknown Company',
        phone: c.phone || '',
        priority: idx < 10 ? 'A' : idx < 25 ? 'B' : 'C',
        vertical: verticalId,
      }));

    return NextResponse.json({
      success: true,
      queue,
      total: queue.length,
      verticalId,
      zip,
    });
  } catch (err) {
    logger.error('Campaign call-queue route error', { route: 'campaigns/call-queue', error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
