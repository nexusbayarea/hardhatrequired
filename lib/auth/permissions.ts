import { NextResponse } from 'next/server';
import { TenantContext } from './tenant';

export type Role = 'OWNER' | 'ADMIN' | 'SALES' | 'VIEWER';

const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 100,
  ADMIN: 80,
  SALES: 50,
  VIEWER: 30
};

export function hasRole(ctx: TenantContext, minimum: Role): boolean {
  if (!ctx.role) return false;
  return (ROLE_HIERARCHY[ctx.role as Role] ?? 0) >= (ROLE_HIERARCHY[minimum] ?? 0);
}

export function requireRole(ctx: TenantContext, minimum: Role): true | NextResponse {
  if (!hasRole(ctx, minimum)) {
    return NextResponse.json(
      { error: `Insufficient permissions. Required role: ${minimum}` },
      { status: 403 }
    );
  }
  return true;
}

export function isOwner(ctx: TenantContext): boolean {
  return ctx.role === 'OWNER';
}

export function isAdminOrAbove(ctx: TenantContext): boolean {
  return hasRole(ctx, 'ADMIN');
}
