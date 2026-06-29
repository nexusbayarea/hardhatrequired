import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getCampaign, updateCampaignStatus } from '@/lib/campaign/helpers';

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const body = await req.json();
    const parsed = validate(z.object({ campaignId: z.string() }), body);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { campaignId } = parsed.data!;
    const campaign = await getCampaign(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Only ACTIVE campaigns can be paused, current state: ${campaign.status}` },
        { status: 409 }
      );
    }

    await updateCampaignStatus(campaignId, 'PAUSED');
    campaign.status = 'PAUSED';

    return NextResponse.json({ success: true, campaign });
  } catch (err) {
    logger.error('Campaign pause route error', { route: 'campaigns/pause', error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
