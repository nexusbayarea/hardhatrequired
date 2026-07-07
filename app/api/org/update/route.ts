import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate, orgUpdateSchema } from '@/lib/validation';
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
    const body = await req.json();
    const { data, error } = validate(orgUpdateSchema, body);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const tenantRes = await resolveTenant(req);
    if (tenantRes instanceof NextResponse) return tenantRes;
    const tenant = tenantRes;

    try {
      const patchBody: Record<string, any> = {};
      if (data.name) patchBody.name = data.name;
      if (data.subscriptionTier) patchBody.subscription_tier = data.subscriptionTier;

      const res = await supabaseFetch(`/rest/v1/organizations?id=eq.${tenant.organizationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(patchBody)
      });
      if (res.ok) {
        const updated = await res.json();
        const org = Array.isArray(updated) ? updated[0] : updated;
        logger.info('Organization updated via Supabase', { tenant: tenant.organizationId });
        return NextResponse.json({
          success: true,
          organization: { id: org.id, name: org.name, subscriptionTier: org.subscription_tier, createdAt: org.created_at }
        });
      }
    } catch {
    }

    const idx = globalThis.__organizations.findIndex(o => o.id === tenant.organizationId);
    if (idx === -1) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 });
    }

    const org = globalThis.__organizations[idx];
    if (data.name) org.name = data.name;
    if (data.subscriptionTier) org.subscriptionTier = data.subscriptionTier;

    logger.info('Organization updated in memory', { tenant: tenant.organizationId });
    return NextResponse.json({
      success: true,
      organization: { id: org.id, name: org.name, subscriptionTier: org.subscriptionTier, createdAt: org.created_at }
    });
  } catch (err: any) {
    logger.error('Organization update failed', { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
