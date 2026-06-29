import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { logger } from '@/lib/logger';
import { listCampaigns } from '@/lib/campaign/helpers';

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const campaigns = await listCampaigns(tenant.organizationId);

    return NextResponse.json({ success: true, campaigns });
  } catch (err) {
    logger.error('Campaign list route error', { route: 'campaigns', error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
