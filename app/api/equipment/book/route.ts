import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { supabaseFetch } from '@/lib/db';
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

  const { equipment_id, lease_start, lease_end, notes } = body as {
    equipment_id?: string;
    lease_start?: string;
    lease_end?: string;
    notes?: string;
  };

  if (!equipment_id || !lease_start) {
    return NextResponse.json({ error: 'equipment_id and lease_start are required' }, { status: 400 });
  }

  try {
    const res = await supabaseFetch('/rest/v1/equipment_bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({
        equipment_id,
        organization_id: tenant.organizationId,
        user_id: tenant.userId || null,
        lease_start,
        lease_end: lease_end || null,
        status: 'inquiry',
        notes: notes || null,
        source: 'web',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Booking failed: ${text}` }, { status: 500 });
    }

    const booking = await res.json();
    return NextResponse.json({ success: true, booking });
  } catch (err: any) {
    logger.error('Equipment booking error', { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
