import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const body = await req.json();
    const parsed = validate(z.object({ campaignId: z.string() }), body);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { campaignId } = parsed.data!;

    const queue = [
      { companyId: 'c001', companyName: 'Acme Corp', phone: '+1-555-0101', priority: 'A' },
      { companyId: 'c002', companyName: 'Globex Inc', phone: '+1-555-0102', priority: 'A' },
      { companyId: 'c003', companyName: 'Initech', phone: '+1-555-0103', priority: 'B' },
      { companyId: 'c004', companyName: 'Hooli', phone: '+1-555-0104', priority: 'B' },
      { companyId: 'c005', companyName: 'Stark Industries', phone: '+1-555-0105', priority: 'C' },
    ];

    return NextResponse.json({ success: true, queue });
  } catch (err) {
    logger.error('Campaign call-queue route error', { route: 'campaigns/call-queue', error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
