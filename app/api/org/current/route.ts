import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { logger } from '@/lib/logger';
import { supabaseFetch } from '@/lib/db';

declare global {
  var __organizations: Array<{
    id: string;
    name: string;
    subscriptionTier: string;
    created_at: string;
  }>;
}
globalThis.__organizations ??= [];

export async function POST(req: NextRequest) {
  try {
    const tenantRes = await resolveTenant(req);
    if (tenantRes instanceof NextResponse) return tenantRes;
    const tenant = tenantRes;

    try {
      const res = await supabaseFetch(`/rest/v1/organizations?id=eq.${tenant.organizationId}&select=id,name,subscription_tier,created_at`);
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0) {
          const org = rows[0];
          return NextResponse.json({
            success: true,
            organization: { id: org.id, name: org.name, subscriptionTier: org.subscription_tier, createdAt: org.created_at }
          });
        }
      }
    } catch {
    }

    const org = globalThis.__organizations.find(o => o.id === tenant.organizationId);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      organization: { id: org.id, name: org.name, subscriptionTier: org.subscriptionTier, createdAt: org.created_at }
    });
  } catch (err: any) {
    logger.error('Fetch current organization failed', { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
