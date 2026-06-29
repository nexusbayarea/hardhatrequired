import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate } from '@/lib/validation';
import { getCompanyOutreach } from '@/lib/outreach/helpers';
import { logger } from '@/lib/logger';

const companyIdSchema = z.object({
  companyId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const body = await req.json();
    const parsed = validate(companyIdSchema, body);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const history = await getCompanyOutreach(parsed.data!.companyId);

    return NextResponse.json({ success: true, history });
  } catch (err: any) {
    logger.error('Outreach status route error', { route: 'outreach/status', error: String(err) });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
