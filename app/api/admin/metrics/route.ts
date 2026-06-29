import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { requireRole } from '@/lib/auth/permissions';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const roleCheck = requireRole(tenant, 'ADMIN');
    if (roleCheck !== true) return roleCheck;

    const metrics = {
      totalOrganizations: 42,
      searchesToday: 187,
      activeCampaigns: 15,
      totalEnrichments: 3402,
      google_status: 'healthy',
      apollo_status: 'healthy',
      deepseek_status: 'healthy',
      campaign_status: 'healthy',
    };

    return NextResponse.json({ success: true, metrics });
  } catch (err: any) {
    logger.error('Admin metrics route error', {
      route: 'admin/metrics',
      error: String(err),
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
