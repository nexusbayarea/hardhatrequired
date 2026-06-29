import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '@/lib/auth/tenant';
import { validate, uuidSchema } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { supabaseFetch } from '@/lib/db';
import { z } from 'zod';

interface SavedSearchRecord {
  id: string;
  organization_id: string;
  vertical_slug: string;
  filters: Record<string, unknown>;
  result_count: number;
  created_at: string;
}

const inMemoryFallback: SavedSearchRecord[] = [];

export async function POST(req: NextRequest) {
  try {
    const tenant = await resolveTenant(req);
    if (tenant instanceof NextResponse) return tenant;

    const body = await req.json();
    const parsed = validate(z.object({ id: uuidSchema }), body);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { id } = parsed.data!;

    let row: SavedSearchRecord | undefined;

    try {
      const res = await supabaseFetch(`/rest/v1/saved_searches?id=eq.${id}`);
      if (res.ok) {
        const data: SavedSearchRecord[] = await res.json();
        row = data[0];
      }
    } catch {
    }

    if (!row) {
      row = inMemoryFallback.find(s => s.id === id);
      if (!row) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: true,
      search: {
        id: row.id,
        organizationId: row.organization_id,
        verticalSlug: row.vertical_slug,
        filters: row.filters,
        resultCount: row.result_count,
        createdAt: row.created_at
      }
    });
  } catch (err) {
    logger.error('Search id route error', { route: 'search/id', error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
