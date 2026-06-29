import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getCampaign } from '@/lib/campaign/helpers';

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const body = await req.json();
    const parsed = validate(z.object({ id: z.string() }), body);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { id } = parsed.data!;
    const campaign = await getCampaign(id);
    if (!campaign) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, campaign });
  } catch (err) {
    logger.error('Campaign id route error', { route: 'campaigns/id', error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
