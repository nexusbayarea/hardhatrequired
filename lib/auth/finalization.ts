import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const RoleSchema = z.enum(['OWNER', 'ADMIN', 'AGENT', 'VIEWER'])
export type IIERole = z.infer<typeof RoleSchema>

export interface TenantContext {
  orgId: string
  userId: string
  role: IIERole
  email: string
  verticalSlug?: string
}

const JWT_PAYLOAD_SCHEMA = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  user_metadata: z.object({
    org_id: z.string().uuid().optional(),
    role: RoleSchema.optional(),
  }).optional(),
  app_metadata: z.object({
    org_id: z.string().uuid().optional(),
    role: RoleSchema.optional(),
  }).optional(),
})

/**
 * C1: Supabase Auth Finalization
 * Parses and validates JWT from Authorization header.
 * Falls back to x-iie-client-context for service-to-service.
 */
export async function finalizeAuth(req: NextRequest): Promise<
  { ok: true; ctx: TenantContext } | { ok: false; error: string; status: number }
> {
  const authHeader = req.headers.get('authorization')
  const clientContext = req.headers.get('x-iie-client-context')

  // Service-to-service bypass (internal agents)
  if (!authHeader && clientContext) {
    const [orgId, role] = clientContext.split(':')
    if (!orgId) {
      return { ok: false, error: 'Invalid client context', status: 401 }
    }
    return {
      ok: true,
      ctx: {
        orgId,
        userId: 'service-agent',
        role: (role as IIERole) || 'AGENT',
        email: 'system@iie.internal',
        verticalSlug: req.headers.get('x-iie-vertical') || undefined,
      },
    }
  }

  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, error: 'Missing or invalid Authorization header', status: 401 }
  }

  const token = authHeader.slice(7)

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return { ok: false, error: 'Invalid or expired token', status: 401 }
    }

    const orgId = user.user_metadata?.org_id || user.app_metadata?.org_id
    const role = (user.user_metadata?.role || user.app_metadata?.role || 'VIEWER') as IIERole

    if (!orgId) {
      return { ok: false, error: 'User not assigned to organization', status: 403 }
    }

    const { data: membership } = await supabase
      .from('organization_users')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return { ok: false, error: 'Organization membership not found', status: 403 }
    }

    const enforcedRole = membership.role as IIERole

    return {
      ok: true,
      ctx: {
        orgId,
        userId: user.id,
        role: enforcedRole,
        email: user.email!,
        verticalSlug: req.headers.get('x-iie-vertical') || undefined,
      },
    }
  } catch (e) {
    return { ok: false, error: 'Auth service error', status: 500 }
  }
}

/**
 * C2-C3: RBAC Middleware
 * Require minimum role level. OWNER > ADMIN > AGENT > VIEWER
 */
const ROLE_HIERARCHY: Record<IIERole, number> = {
  OWNER: 4,
  ADMIN: 3,
  AGENT: 2,
  VIEWER: 1,
}

export function requireRole(ctx: TenantContext, minimum: IIERole): boolean {
  return ROLE_HIERARCHY[ctx.role] >= ROLE_HIERARCHY[minimum]
}

export function assertRole(ctx: TenantContext, minimum: IIERole) {
  if (!requireRole(ctx, minimum)) {
    throw new AuthError(
      `Role ${ctx.role} insufficient. Requires ${minimum} or higher.`,
      403
    )
  }
}

export class AuthError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message)
    this.name = 'AuthError'
  }
}
