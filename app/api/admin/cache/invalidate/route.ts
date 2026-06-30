import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { requireRole } from '@/lib/auth/permissions';
import { invalidateScraperCache } from '@/lib/scraper/cache';
import { invalidateMarketCache } from '@/lib/market/cache';
import { getStateFromZip } from '@/lib/market/providers/base';

const VALID_PROVIDERS = ['regulatory', 'intelligence', 'scraper_leads'] as const;
type CacheProvider = typeof VALID_PROVIDERS[number];

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const roleCheck = requireRole(tenant, 'ADMIN');
    if (roleCheck !== true) return roleCheck;

    const body = await req.json();
    const { provider, vertical, zip } = body || {};

    if (!provider || !vertical) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, vertical' },
        { status: 400 }
      );
    }

    if (!VALID_PROVIDERS.includes(provider as CacheProvider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` },
        { status: 400 }
      );
    }

    const state = getStateFromZip(zip || '00000');

    switch (provider as CacheProvider) {
      case 'regulatory':
        await invalidateScraperCache(state, vertical);
        break;
      case 'intelligence':
        await invalidateMarketCache(state, vertical);
        break;
      case 'scraper_leads':
        await invalidateMarketCache(state, vertical);
        break;
    }

    return NextResponse.json({
      success: true,
      invalidated: { provider, vertical, state, zip: zip || undefined },
    });
  } catch (err: any) {
    console.error('[CacheInvalidate] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
