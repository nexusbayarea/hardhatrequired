import { supabaseFetch, supabaseRpc } from '@/lib/db';
import { getOntologyFromCache, setOntologyInCache, getRelationshipsFromCache, setRelationshipsInCache, SerializedRelationship } from './cache';
import {
  CompiledOntology,
  CompiledOntologyEntry,
  OntologyEntityType,
  OntologyRelationship,
  MatchType,
  OntologySource,
} from './types';

export interface OntologyLoaderConfig {
  verticalId?: string;
  skipCache?: boolean;
  organizationId?: string;
}

// ── In-memory caches ──────────────────────────────────────────────────────────

let globalCache: CompiledOntology | null = null;
let verticalCache: Map<string, CompiledOntology> = new Map();
let relationshipCache: OntologyRelationship[] | null = null;

// ── Request coalescing (prevents stampede on cold Redis) ──────────────────────
// If 50 requests hit simultaneously and Redis is cold, only 1 DB call fires.
// All others await the same promise.

const inFlightPromises = new Map<string, Promise<CompiledOntology>>();
let inFlightRelationshipsPromise: Promise<OntologyRelationship[]> | null = null;

export async function loadOntology(config: OntologyLoaderConfig = {}): Promise<CompiledOntology> {
  const cacheKey = config.verticalId || '__global__';

  // 1. Hot memory cache
  if (!config.skipCache) {
    if (config.verticalId && verticalCache.has(config.verticalId)) {
      return verticalCache.get(config.verticalId)!;
    }
    if (!config.verticalId && globalCache) {
      return globalCache;
    }
  }

  // 2. Request coalescing — deduplicate concurrent in-flight loads
  if (!config.skipCache && inFlightPromises.has(cacheKey)) {
    return inFlightPromises.get(cacheKey)!;
  }

  // 3. Start loading
  const promise = loadFromChain(config);
  inFlightPromises.set(cacheKey, promise);

  try {
    const ontology = await promise;
    return ontology;
  } finally {
    inFlightPromises.delete(cacheKey);
  }
}

async function loadFromChain(config: OntologyLoaderConfig): Promise<CompiledOntology> {
  // Redis cache (with versioned keys)
  if (!config.skipCache) {
    const cached = await getOntologyFromCache(config.verticalId);
    if (cached) {
      setMemoryCache(cached, config.verticalId);
      return cached;
    }
  }

  // DB load
  const ontology = await loadFromDb(config.verticalId, config.organizationId);

  // Populate caches
  await setOntologyInCache(ontology, config.verticalId, ontology.version);
  setMemoryCache(ontology, config.verticalId);

  return ontology;
}

export async function loadRelationships(skipCache?: boolean): Promise<OntologyRelationship[]> {
  if (!skipCache && relationshipCache) {
    return relationshipCache;
  }

  // Request coalescing — deduplicate concurrent loads
  if (!skipCache && inFlightRelationshipsPromise) {
    return inFlightRelationshipsPromise;
  }

  inFlightRelationshipsPromise = (async () => {
    if (!skipCache) {
      const cached = await getRelationshipsFromCache();
      if (cached) {
        const converted = cached.map(r => fromSerialized(r));
        relationshipCache = converted;
        return converted;
      }
    }

    const relationships = await loadRelationshipsFromDb();

    await setRelationshipsInCache(relationships.map(r => toSerialized(r)));
    relationshipCache = relationships;

    return relationships;
  })();

  try {
    return await inFlightRelationshipsPromise;
  } finally {
    inFlightRelationshipsPromise = null;
  }
}

export function invalidateMemoryCache(verticalId?: string): void {
  if (verticalId) {
    verticalCache.delete(verticalId);
  } else {
    globalCache = null;
    verticalCache.clear();
    relationshipCache = null;
  }
  // Also clear any in-flight promises
  inFlightPromises.clear();
}

// ── DB loading ─────────────────────────────────────────────────────────────────

interface DbOntologyRow {
  canonical_id: string;
  entity_type: string;
  vertical_id?: string;
  label: string;
  alias: string;
  language_code: string;
  weight: number;
  confidence_weight: number;
  match_type: string;
  source: string;
  organization_id?: string | null;
}

async function loadFromDb(verticalId?: string, organizationId?: string): Promise<CompiledOntology> {
  try {
    let url: string;
    if (verticalId) {
      const params = new URLSearchParams({ p_vertical_id: verticalId });
      if (organizationId) params.set('p_organization_id', organizationId);
      url = `/rest/v1/rpc/get_vertical_ontology?${params.toString()}`;
    } else {
      url = '/rest/v1/rpc/get_active_ontology';
    }

    const res = await supabaseFetch(url);
    if (!res.ok) return emptyOntology();

    const rows: DbOntologyRow[] = await res.json();
    if (!rows || rows.length === 0) return emptyOntology();

    return buildFromRows(rows, verticalId);
  } catch {
    return emptyOntology();
  }
}

async function loadRelationshipsFromDb(): Promise<OntologyRelationship[]> {
  try {
    const res = await supabaseRpc('get_ontology_relationships');
    if (!res.ok) return [];

    const rows = await res.json();
    return (rows || []).map((r: any) => ({
      sourceCanonicalId: r.source_canonical_id,
      targetCanonicalId: r.target_canonical_id,
      relation: r.relation,
      metadata: r.metadata || {},
    }));
  } catch {
    return [];
  }
}

function buildFromRows(rows: DbOntologyRow[], verticalId?: string): CompiledOntology {
  const entityMap = new Map<string, {
    canonicalId: string;
    entityType: string;
    verticalId?: string;
    aliases: Map<string, { phrase: string; weight: number; confidenceWeight: number; matchType: string; source: string }>;
  }>();

  for (const row of rows) {
    if (!entityMap.has(row.canonical_id)) {
      entityMap.set(row.canonical_id, {
        canonicalId: row.canonical_id,
        entityType: row.entity_type,
        verticalId: row.vertical_id || verticalId,
        aliases: new Map(),
      });
    }
    const entry = entityMap.get(row.canonical_id)!;
    const phrase = row.alias.toLowerCase();
    if (!entry.aliases.has(phrase)) {
      entry.aliases.set(phrase, {
        phrase,
        weight: row.weight ?? 100,
        confidenceWeight: row.confidence_weight ?? row.weight ?? 100,
        matchType: row.match_type || 'exact',
        source: row.source || 'manual_seed',
      });
    } else {
      // Prefer higher weight for duplicates
      const existing = entry.aliases.get(phrase)!;
      if ((row.weight ?? 100) > existing.weight) {
        existing.weight = row.weight ?? 100;
        existing.confidenceWeight = row.confidence_weight ?? row.weight ?? 100;
      }
    }
  }

  const entries: CompiledOntologyEntry[] = [];
  const aliasMap = new Map();
  const verticalIndex = new Map<string, string[]>();
  const typeIndex = new Map<OntologyEntityType, string[]>();

  for (const entry of entityMap.values()) {
    const aliases = Array.from(entry.aliases.values()).map(a => ({
      phrase: a.phrase,
      weight: a.weight,
      confidenceWeight: a.confidenceWeight,
      matchType: (a.matchType || 'exact') as MatchType,
      source: (a.source || 'manual_seed') as OntologySource,
    }));
    entries.push({
      canonicalId: entry.canonicalId,
      entityType: entry.entityType as CompiledOntologyEntry['entityType'],
      verticalId: entry.verticalId,
      aliases,
    });

    for (const a of aliases) {
      aliasMap.set(a.phrase, {
        canonicalId: entry.canonicalId,
        weight: a.weight,
        confidenceWeight: a.confidenceWeight,
        entityType: entry.entityType,
        matchType: (a.matchType || 'exact') as MatchType,
        source: (a.source || 'manual_seed') as OntologySource,
      });
    }

    if (entry.verticalId) {
      if (!verticalIndex.has(entry.verticalId)) verticalIndex.set(entry.verticalId, []);
      verticalIndex.get(entry.verticalId)!.push(entry.canonicalId);
    }

    const eType = entry.entityType as OntologyEntityType;
    if (!typeIndex.has(eType)) typeIndex.set(eType, []);
    typeIndex.get(eType)!.push(entry.canonicalId);
  }

  return {
    entries,
    aliasMap,
    verticalIndex,
    typeIndex,
    version: 0, // will be set by Redis version tracking on write
  };
}

function emptyOntology(): CompiledOntology {
  return {
    entries: [],
    aliasMap: new Map(),
    verticalIndex: new Map(),
    typeIndex: new Map(),
    version: 0,
  };
}

function setMemoryCache(ontology: CompiledOntology, verticalId?: string): void {
  if (verticalId) {
    verticalCache.set(verticalId, ontology);
  } else {
    globalCache = ontology;
    verticalCache.clear();
  }
}

function fromSerialized(s: SerializedRelationship): OntologyRelationship {
  return {
    sourceCanonicalId: s.s,
    targetCanonicalId: s.t,
    relation: s.r,
    metadata: {},
  };
}

function toSerialized(r: OntologyRelationship): SerializedRelationship {
  return {
    s: r.sourceCanonicalId,
    t: r.targetCanonicalId,
    r: r.relation,
  };
}
