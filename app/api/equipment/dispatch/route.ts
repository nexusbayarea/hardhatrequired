import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const tenant = await resolveTenant(req);
  if (tenant instanceof NextResponse) return tenant;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { dispatch_email, equipment_id, provider_name, equipment_class, daily_rate, delivery_fee, lease_start, lease_end } = body as {
    dispatch_email?: string;
    equipment_id?: string;
    provider_name?: string;
    equipment_class?: string;
    daily_rate?: number;
    delivery_fee?: number;
    lease_start?: string;
    lease_end?: string;
  };

  if (!dispatch_email || !equipment_id) {
    return NextResponse.json({ error: 'dispatch_email and equipment_id are required' }, { status: 400 });
  }

  const subject = `Equipment Rental Inquiry: ${equipment_class || 'Equipment'} – ${provider_name || 'Provider'}`;
  const bodyLines = [
    `New rental inquiry from ${tenant.organizationId}`,
    ``,
    `Equipment: ${equipment_class || 'N/A'}`,
    `Provider: ${provider_name || 'N/A'}`,
    `Daily Rate: $${daily_rate || 0}`,
    `Delivery Fee: $${delivery_fee || 0}`,
    `Lease Start: ${lease_start || 'N/A'}`,
    `Lease End: ${lease_end || 'N/A'}`,
    ``,
    `Contact: ${tenant.userId || 'N/A'}`,
  ].join('\n');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'equipment@hardhatrequired.com',
        to: dispatch_email,
        subject,
        text: bodyLines,
      }),
    });

    if (!res.ok) {
      // Fallback: log the dispatch intent
      logger.info('Equipment dispatch (email fallback)', {
        to: dispatch_email,
        subject,
        organizationId: tenant.organizationId,
      });
      return NextResponse.json({ success: true, method: 'logged' });
    }

    return NextResponse.json({ success: true, method: 'email' });
  } catch (err: any) {
    logger.warn('Equipment dispatch failed, using fallback', { error: err.message });
    return NextResponse.json({ success: true, method: 'logged' });
  }
}
