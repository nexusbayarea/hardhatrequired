import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate, outreachLogSchema } from '@/lib/validation';
import { logOutreach } from '@/lib/outreach/helpers';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const body = await req.json();
    const callBody = { ...body, interactionType: 'CALL' as const };
    const parsed = validate(outreachLogSchema, callBody);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const entry = await logOutreach({
      organizationId: tenant.organizationId,
      companyId: parsed.data!.companyId,
      contactId: parsed.data!.contactId,
      interactionType: 'CALL',
      outcome: parsed.data!.outcome,
      notes: parsed.data!.notes,
    });

    return NextResponse.json({ success: true, entry });
  } catch (err: any) {
    logger.error('Outreach call route error', { route: 'outreach/call', error: String(err) });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
