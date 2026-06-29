import { NextRequest, NextResponse } from 'next/server';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { parseSession, isServerToServer } from './session';
import { VerticalConfig } from '@/types/config';

export interface TenantContext {
  verticalConfig: VerticalConfig;
  organizationId: string;
  userId?: string;
  role?: string;
}

/**
 * Resolve tenant context from request headers.
 * 1. If Authorization Bearer JWT present, parse session.
 * 2. Fall back to x-iie-client-context for server-to-server (service-role) calls.
 * Returns a JSON error response if neither validates.
 */
export async function resolveTenant(req: NextRequest): Promise<TenantContext | NextResponse> {
  const session = parseSession(req);
  const isS2S = isServerToServer(req);

  const contextHeader = req.headers.get('x-iie-client-context');
  if (!contextHeader) {
    return NextResponse.json(
      { error: 'X-IIE-Client-Context header is required.' },
      { status: 401 }
    );
  }

  const verticalConfig = await getVerticalConfigByDomain(contextHeader);
  if (!verticalConfig) {
    return NextResponse.json(
      { error: `Invalid client context: '${contextHeader}'` },
      { status: 403 }
    );
  }

  return {
    verticalConfig,
    organizationId: session?.organizationId || verticalConfig.id,
    userId: session?.id,
    role: session?.role
  };
}

/**
 * Middleware-style guard. Returns the context if valid, or a JSON error response.
 */
export async function requireTenant(req: NextRequest): Promise<TenantContext | NextResponse<{ error: string }>> {
  return resolveTenant(req);
}
