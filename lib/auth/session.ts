import { NextRequest } from 'next/server';

export interface SessionUser {
  id: string;
  organizationId: string;
  role: 'OWNER' | 'ADMIN' | 'SALES' | 'VIEWER';
  email?: string;
}

/**
 * Parse JWT claims from x-iie-client-context header or Authorization bearer.
 * Under `output: export` we cannot use Supabase Auth helpers; instead we
 * rely on a signed JWT passed in the Authorization header (client-side)
 * or the tenant slug from x-iie-client-context (server-to-server).
 */
export function parseSession(req: NextRequest): SessionUser | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        return {
          id: payload.sub || payload.id,
          organizationId: payload.org_id || payload.organization_id,
          role: payload.role || 'VIEWER',
          email: payload.email
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * For server-to-server calls where no user session exists,
 * the x-iie-client-context header carries the vertical/tenant slug
 * and we skip user-level auth, relying on service-role DB access.
 */
export function isServerToServer(req: NextRequest): boolean {
  return !!req.headers.get('x-iie-client-context') && !req.headers.get('authorization');
}
