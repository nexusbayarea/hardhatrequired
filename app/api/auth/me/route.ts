import { NextRequest, NextResponse } from 'next/server';
import { parseSession } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = parseSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.id,
        email: session.email,
        role: session.role,
        organizationId: session.organizationId
      }
    });
  } catch (err: any) {
    logger.error('Session lookup failed', { error: err.message });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
