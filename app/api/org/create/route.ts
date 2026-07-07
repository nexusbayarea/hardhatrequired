import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate, orgCreateSchema } from '@/lib/validation';
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
    const { data, error } = validate(orgCreateSchema, body);
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
      const checkRes = await supabaseFetch(`/rest/v1/organizations?id=eq.${tenant.organizationId}&select=id`);
      if (checkRes.ok) {
        const existing = await checkRes.json();
        if (existing.length > 0) {
          return NextResponse.json({ error: 'Organization already exists for this tenant.' }, { status: 409 });
        }
      }

      const insertRes = await supabaseFetch('/rest/v1/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          id: tenant.organizationId,
          name: data.name,
          subscription_tier: data.subscriptionTier || 'starter',
          created_at: new Date().toISOString()
        })
      });

      if (insertRes.ok) {
        const created = await insertRes.json();
        logger.info('Organization created via Supabase', { tenant: tenant.organizationId });
        return NextResponse.json({
          success: true,
          organization: { id: created.id, name: created.name, createdAt: created.created_at }
        }, { status: 201 });
      }
    } catch {
    }

    if (globalThis.__organizations.find(o => o.id === tenant.organizationId)) {
      return NextResponse.json({ error: 'Organization already exists for this tenant.' }, { status: 409 });
    }

    const orgRecord = {
      id: tenant.organizationId,
      name: data.name,
      subscriptionTier: data.subscriptionTier || 'starter',
      created_at: new Date().toISOString()
    };
    globalThis.__organizations.push(orgRecord);

    logger.info('Organization created in memory', { tenant: tenant.organizationId });
    return NextResponse.json({
      success: true,
      organization: { id: orgRecord.id, name: orgRecord.name, createdAt: orgRecord.created_at }
    }, { status: 201 });
  } catch (err: any) {
    logger.error('Organization creation failed', { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
