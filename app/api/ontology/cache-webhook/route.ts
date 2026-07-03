import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch, supabaseRpc } from '@/lib/db';
import { setOntologyInCache, checkDebounce, clearDebounce } from '@/lib/ontology/cache';

/**
 * Consumes pg_net webhook notifications from ontology_aliases mutations.
 *
 * Features:
 *   - Debounce: skips if same vertical was refreshed < 60s ago
 *   - Versioned keys: writes to ontology:vertical:{id}:v{N} (stale keys never served)
 *   - Request coalescing via loader.ts (not here — this is fire-and-forget)
 *
 * Flow:
 *   ontology_aliases mutation
 *     → pg_net HTTP POST
 *       → check Redis debounce key (ontology:debounce:{vertical_id})
 *         → if debounced: skip (return 200)
 *         → else: fetch fresh DB state, write to Redis with bumped version
 */

const WEBHOOK_SECRET = process.env.ONTOLOGY_WEBHOOK_SECRET || 'change-me-in-production';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate
    const secret = req.headers.get('X-Webhook-Secret');
    if (!secret || secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { vertical_id, operation } = body as { vertical_id?: string; operation?: string };

    if (!vertical_id) {
      return NextResponse.json({ error: 'Missing vertical_id' }, { status: 400 });
    }

    // 2. Debounce — skip if refreshed < 60s ago
    const isDebounced = await checkDebounce(vertical_id);
    if (isDebounced) {
      return NextResponse.json({
        success: true,
        message: `Debounced: vertical [${vertical_id}] was recently refreshed`,
        operation,
        debounced: true,
      });
    }

    // 3. Bump version in DB (trigger already does this, but ensure it happened)
    const versionRes = await supabaseRpc('bump_ontology_version', { p_vertical_id: vertical_id });
    const newVersion = versionRes.ok ? parseInt(await versionRes.text(), 10) || 0 : 0;

    // 4. Fetch fresh state from DB
    const res = await supabaseRpc('get_vertical_ontology', { p_vertical_id: vertical_id });
    if (!res.ok) {
      throw new Error(`Supabase RPC failed: ${res.status}`);
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No active ontology for vertical [${vertical_id}], version bumped to ${newVersion}`,
        operation,
        entityCount: 0,
        version: newVersion,
      });
    }

    // 5. Build optimized cache payload with all new fields
    const entityMap = new Map<string, {
      canonicalId: string;
      entityType: string;
      verticalId?: string;
      aliases: Map<string, { p: string; w: number; cw: number; mt: string; s: string }>;
    }>();

    for (const row of rows) {
      const cid = row.canonical_id as string;
      if (!entityMap.has(cid)) {
        entityMap.set(cid, {
          canonicalId: cid,
          entityType: row.entity_type as string,
          verticalId: (row.vertical_id as string) || vertical_id,
          aliases: new Map(),
        });
      }
      const entry = entityMap.get(cid)!;
      const phrase = (row.alias as string).toLowerCase();
      if (!entry.aliases.has(phrase)) {
        entry.aliases.set(phrase, {
          p: phrase,
          w: (row.weight as number) ?? 100,
          cw: (row.confidence_weight as number) ?? (row.weight as number) ?? 100,
          mt: (row.match_type as string) || 'exact',
          s: (row.source as string) || 'manual_seed',
        });
      }
    }

    // 6. Build ontology object with version
    const entries = Array.from(entityMap.values()).map(e => ({
      c: e.canonicalId,
      t: e.entityType,
      v: e.verticalId,
      a: Array.from(e.aliases.values()),
    }));

    const ontologyPayload = {
      v: newVersion,
      e: entries,
    };

    // 7. Write to Redis with versioned key
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      // Set version tracker
      await fetch(`${redisUrl}/set/ontology:version:${vertical_id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(String(newVersion)),
      });

      // Set versioned cache data
      await fetch(`${redisUrl}/set/ontology:vertical:${vertical_id}:v${newVersion}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ontologyPayload),
      });

      // 24h expiry on both
      await fetch(`${redisUrl}/expire/ontology:version:${vertical_id}/86400`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${redisToken}` },
      });
      await fetch(`${redisUrl}/expire/ontology:vertical:${vertical_id}:v${newVersion}/86400`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${redisToken}` },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Redis cache refreshed for vertical [${vertical_id}] at v${newVersion}`,
      operation,
      entityCount: entityMap.size,
      version: newVersion,
    });

  } catch (err: any) {
    console.error('[ontology-cache-webhook]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
