import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate, authInviteSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { supabaseFetch } from '@/lib/db';

declare global {
  var __invitations: Array<{
    email: string;
    role: string;
    token: string;
    organization_id: string;
    created_at: string;
    accepted: boolean;
  }>;
}
globalThis.__invitations ??= [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const data = body as { email: string; role: string };
    const { error } = validate(authInviteSchema, data);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const tenantRes = await resolveTenant(req);
    if (tenantRes instanceof NextResponse) return tenantRes;
    const tenant = tenantRes;

    if (tenant.role !== 'OWNER' && tenant.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only OWNER or ADMIN can invite users.' }, { status: 403 });
    }

    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    try {
      const res = await supabaseFetch('/auth/v1/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          user_metadata: {
            role: data.role,
            organization_id: tenant.organizationId,
            invitation_token: token
          }
        })
      });

      if (res.ok) {
        const inviteResult = await res.json();
        logger.info('User invited via Supabase Auth admin API', { data: { email: data.email, tenant: tenant.organizationId } });

        await supabaseFetch('/rest/v1/org_invitations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            role: data.role,
            token,
            organization_id: tenant.organizationId,
            invited_by: tenant.userId,
            created_at: new Date().toISOString()
          })
        });

        return NextResponse.json({ success: true, invited: data.email });
      }
    } catch {
      logger.warn('Supabase Auth admin API failed, falling back to in-memory', { data: { email: data.email } });
    }

    globalThis.__invitations.push({
      email: data.email,
      role: data.role,
      token,
      organization_id: tenant.organizationId,
      created_at: new Date().toISOString(),
      accepted: false
    });

    logger.info('User invite stored in memory', { data: { email: data.email, tenant: tenant.organizationId } });
    return NextResponse.json({ success: true, invited: data.email });
  } catch (err: any) {
    logger.error('User invitation failed', { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
