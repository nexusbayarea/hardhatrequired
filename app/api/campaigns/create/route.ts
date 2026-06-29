import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate, campaignCreateSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { createCampaign } from '@/lib/campaign/helpers';

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const body = await req.json();
    const parsed = validate(campaignCreateSchema, body);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { name, verticalSlug } = parsed.data!;
    const campaign = await createCampaign({
      organizationId: tenant.organizationId,
      name,
      verticalSlug: verticalSlug || tenant.verticalConfig.slug
    });

    return NextResponse.json({ success: true, campaign }, { status: 201 });
  } catch (err) {
    logger.error('Campaign create route error', { route: 'campaigns/create', error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
