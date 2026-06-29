import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { logger } from '@/lib/logger';
import { supabaseRpc } from '@/lib/db';

export async function POST(req: NextRequest) {
  const tenant = await resolveTenant(req);
  if (tenant instanceof NextResponse) return tenant;

  try {
    const res = await supabaseRpc('get_dashboard_reports', { p_org_id: tenant.organizationId });
    if (!res.ok) throw new Error(`Supabase responded ${res.status}`);
    const reports = await res.json();
    return NextResponse.json({ success: true, reports });
  } catch (err: any) {
    logger.warn('Dashboard reports: Supabase fetch failed', {
      error: err.message,
      tenant: tenant.organizationId,
    });
    return NextResponse.json({ success: true, reports: [] });
  }
}
