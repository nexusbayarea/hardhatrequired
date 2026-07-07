import { NextRequest, NextResponse } from 'next/server';
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
    const { token } = body;
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invitation token is required.' }, { status: 400 });
    }

    try {
      const res = await supabaseFetch(`/rest/v1/org_invitations?token=eq.${token}&accepted=eq.false&select=*`);
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0) {
          await supabaseFetch(`/rest/v1/org_invitations?token=eq.${token}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ accepted: true, accepted_at: new Date().toISOString() })
          });
          logger.info('Invitation accepted via Supabase', { data: { token } });
          return NextResponse.json({ success: true, message: 'Invitation accepted' });
        }
        return NextResponse.json({ error: 'Invalid or expired invitation token.' }, { status: 404 });
      }
    } catch {
    }

    const inviteIdx = globalThis.__invitations.findIndex(i => i.token === token && !i.accepted);
    if (inviteIdx === -1) {
      return NextResponse.json({ error: 'Invalid or expired invitation token.' }, { status: 404 });
    }

    globalThis.__invitations[inviteIdx].accepted = true;
    logger.info('Invitation accepted in memory', { data: { token } });
    return NextResponse.json({ success: true, message: 'Invitation accepted' });
  } catch (err: any) {
    logger.error('Invitation acceptance failed', { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
