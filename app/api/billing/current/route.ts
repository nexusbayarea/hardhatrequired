import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { logger } from '@/lib/logger';
import { supabaseFetch } from '@/lib/db';

declare global {
  var __iie_subscription:
    | { planTier: string; status: string; currentPeriodEnd: string }
    | undefined;
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    let subscription: {
      planTier: string;
      status: string;
      currentPeriodEnd: string;
    } | null = null;

    try {
      const res = await supabaseFetch(`/rest/v1/subscriptions?organization_id=eq.${tenant.organizationId}&select=*`);
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) {
          subscription = {
            planTier: data[0].plan_tier || 'starter',
            status: data[0].status || 'active',
            currentPeriodEnd:
              data[0].current_period_end || new Date().toISOString(),
          };
        }
      }
    } catch {
    }

    if (!subscription) {
      globalThis.__iie_subscription ??= {
        planTier: 'starter',
        status: 'active',
        currentPeriodEnd: new Date(
          Date.now() + 30 * 86400000,
        ).toISOString(),
      };
      subscription = globalThis.__iie_subscription;
    }

    return NextResponse.json({ success: true, subscription });
  } catch (err: any) {
    logger.error('Billing current route error', {
      route: 'billing/current',
      error: String(err),
    });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
