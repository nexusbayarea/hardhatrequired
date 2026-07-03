import {
  CompiledOntology,
  CompiledOntologyEntry,
  OntologyEntityType,
  OntologyRelationship,
  AliasMeta,
  MatchType,
  OntologySource,
} from './types';

const ONTOLOGY_PREFIX = 'ontology:vertical:';
const ONTOLOGY_VERSION_PREFIX = 'ontology:version:';
const ONTOLOGY_GLOBAL_KEY = 'ontology:global';
const ONTOLOGY_RELATIONSHIPS_KEY = 'ontology:relationships';
const ONTOLOGY_DEBOUNCE_PREFIX = 'ontology:debounce:';
const ONTOLOGY_TTL = 86_400;
const DEBOUNCE_TTL = 60;

type SimpleRedis = { get: (key: string) => Promise<string | null>; set: (key: string, value: string, opts?: { ex?: number }) => Promise<string | null> };

function getRedis(): SimpleRedis | null {
  try {
    const { Redis } = require('@upstash/redis');
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;
    return new Redis({ url, token }) as SimpleRedis;
  } catch {
    return null;
  }
}

// ── Version tracking ──────────────────────────────────────────────────────────

async function getRedisVersion(verticalId: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  try {
    const raw = await redis.get(`${ONTOLOGY_VERSION_PREFIX}${verticalId}`);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

async function setRedisVersion(verticalId: string, version: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`${ONTOLOGY_VERSION_PREFIX}${verticalId}`, String(version), { ex: ONTOLOGY_TTL });
  } catch {
    // best-effort
  }
}

function buildCacheKey(verticalId: string, version: number): string {
  return version > 0
    ? `${ONTOLOGY_PREFIX}${verticalId}:v${version}`
    : `${ONTOLOGY_PREFIX}${verticalId}`;
}

// ── Debounce ───────────────────────────────────────────────────────────────────

export async function checkDebounce(verticalId: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const key = `${ONTOLOGY_DEBOUNCE_PREFIX}${verticalId}`;
    const existing = await redis.get(key);
    if (existing) return true;
    await redis.set(key, '1', { ex: DEBOUNCE_TTL });
    return false;
  } catch {
    return false;
  }
}

export async function clearDebounce(verticalId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(`${ONTOLOGY_DEBOUNCE_PREFIX}${verticalId}`, '', { ex: 1 });
  } catch {
    // best-effort
  }
}

// ── Cache read/write (versioned keys) ─────────────────────────────────────────

export async function getOntologyFromCache(verticalId?: string): Promise<CompiledOntology | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    let key: string;
    if (verticalId) {
      const version = await getRedisVersion(verticalId);
      key = buildCacheKey(verticalId, version);
    } else {
      key = ONTOLOGY_GLOBAL_KEY;
    }
    const raw = await redis.get(key);
    if (!raw) return null;
    return hydrateCompiledOntology(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function setOntologyInCache(
  ontology: CompiledOntology,
  verticalId?: string,
  version?: number,
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    let key: string;
    if (verticalId) {
      const v = version ?? ontology.version ?? 0;
      if (v > 0) await setRedisVersion(verticalId, v);
      key = buildCacheKey(verticalId, v);
    } else {
      key = ONTOLOGY_GLOBAL_KEY;
    }
    const serialized = serializeCompiledOntology(ontology);
    await redis.set(key, JSON.stringify(serialized), { ex: ONTOLOGY_TTL });
    return true;
  } catch {
    return false;
  }
}

export async function getRelationshipsFromCache(): Promise<SerializedRelationship[] | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const raw = await redis.get(ONTOLOGY_RELATIONSHIPS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setRelationshipsInCache(relationships: SerializedRelationship[]): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    await redis.set(ONTOLOGY_RELATIONSHIPS_KEY, JSON.stringify(relationships), { ex: ONTOLOGY_TTL });
    return true;
  } catch {
    return false;
  }
}

export async function invalidateOntologyCache(verticalId?: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    if (verticalId) {
      const version = await getRedisVersion(verticalId);
      const key = buildCacheKey(verticalId, version);
      await redis.set(key, '', { ex: 1 });
    } else {
      await redis.set(ONTOLOGY_GLOBAL_KEY, '', { ex: 1 });
    }
  } catch {
    // best-effort
  }
}

// ── Serialization ──────────────────────────────────────────────────────────────

export interface SerializedEntry {
  c: string;
  t: string;
  v?: string;
  a: { p: string; w: number; cw: number; mt: string; s: string }[];
}

export interface SerializedRelationship {
  s: string;
  t: string;
  r: string;
}

function serializeCompiledOntology(ontology: CompiledOntology): { e: SerializedEntry[]; v: number } {
  return {
    v: ontology.version || 0,
    e: ontology.entries.map(e => ({
      c: e.canonicalId,
      t: e.entityType,
      v: e.verticalId,
      a: e.aliases.map(a => ({
        p: a.phrase,
        w: a.weight,
        cw: a.confidenceWeight,
        mt: a.matchType,
        s: a.source,
      })),
    })),
  };
}

function hydrateCompiledOntology(data: { e: SerializedEntry[]; v?: number }): CompiledOntology {
  const entries: CompiledOntologyEntry[] = data.e.map(s => ({
    canonicalId: s.c,
    entityType: s.t as CompiledOntologyEntry['entityType'],
    verticalId: s.v,
    aliases: s.a.map(a => ({
      phrase: a.p,
      weight: a.w,
      confidenceWeight: a.cw,
      matchType: a.mt as MatchType,
      source: a.s as OntologySource,
    })),
  }));

  const aliasMap = new Map<string, AliasMeta>();
  const verticalIndex = new Map<string, string[]>();
  const typeIndex = new Map<OntologyEntityType, string[]>();

  for (const entry of entries) {
    for (const alias of entry.aliases) {
      aliasMap.set(alias.phrase.toLowerCase(), {
        canonicalId: entry.canonicalId,
        weight: alias.weight,
        confidenceWeight: alias.confidenceWeight,
        entityType: entry.entityType,
        matchType: alias.matchType,
        source: alias.source,
      });
    }

    if (entry.verticalId) {
      if (!verticalIndex.has(entry.verticalId)) verticalIndex.set(entry.verticalId, []);
      verticalIndex.get(entry.verticalId)!.push(entry.canonicalId);
    }

    if (!typeIndex.has(entry.entityType)) typeIndex.set(entry.entityType, []);
    typeIndex.get(entry.entityType)!.push(entry.canonicalId);
  }

  return { entries, aliasMap, verticalIndex, typeIndex, version: data.v || 0 };
}
