import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate } from '@/lib/validation';
import { logOutreach } from '@/lib/outreach/helpers';
import { logger } from '@/lib/logger';

const emailOutreachSchema = z.object({
  companyId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  subject: z.string().min(1).max(998),
  body: z.string().min(1),
  template: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const body = await req.json();
    const parsed = validate(emailOutreachSchema, body);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    await logOutreach({
      organizationId: tenant.organizationId,
      companyId: parsed.data!.companyId,
      contactId: parsed.data!.contactId,
      interactionType: 'EMAIL',
      outcome: 'sent_proposal',
      notes: `Subject: ${parsed.data!.subject}`,
    });

    return NextResponse.json({ success: true, sent: true });
  } catch (err: any) {
    logger.error('Outreach email route error', { route: 'outreach/email', error: String(err) });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
