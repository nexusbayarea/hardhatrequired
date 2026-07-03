/**
 * Seed ontology tables from existing hardcoded dictionaries.
 *
 * Reads all current TS dictionaries:
 *   - EQUIPMENT_ONTOLOGY (28 equipment types × aliases)
 *   - VERTICAL_SERVICE_ONTOLOGY (~20 verticals × service categories)
 *   - GOOGLE_TYPE_TO_VERTICAL_SIGNALS (Google Place types → terms)
 *   - DISPOSAL_GOOGLE_TYPE_SIGNALS (disposal Google types)
 *   - NATIONAL_DISPOSAL_OPERATORS (known disposal brands)
 *   - DISPOSAL_APOLLO_SIGNALS (Apollo disposal signals)
 *   - VERTICAL_DISPOSAL_SIGNALS (per-vertical disposal terms)
 *
 * And inserts them into ontology_entities + ontology_aliases + ontology_relationships.
 *
 * Run: npx tsx scripts/seed-ontology.ts
 *
 * Safe to re-run — uses ON CONFLICT (canonical_id) DO NOTHING for entities,
 * and deletes/re-inserts aliases for freshness.
 */

import 'dotenv/config';
import { supabaseFetch } from '../lib/db';

// ── Import all existing hardcoded dictionaries ────────────────────────────────
import { EQUIPMENT_ONTOLOGY, VERTICAL_SERVICE_ONTOLOGY } from '../lib/search/extraction/ontology';
import { GOOGLE_TYPE_TO_VERTICAL_SIGNALS } from '../lib/market/providers/google';
import {
  DISPOSAL_GOOGLE_TYPE_SIGNALS,
  DISPOSAL_APOLLO_SIGNALS,
} from '../lib/market/disposal-signals';
import { OntologySeedEntry, OntologyRelationshipSeed } from '../lib/ontology/types';

// These are imported indirectly — extract the data we need
const VERTICAL_DISPOSAL_SIGNALS_DATA: Record<string, {
  primary: { term: string; weight: number }[];
  secondary: { term: string; weight: number }[];
}> = {
  slurry_processing: { primary: [{ term: 'concrete washout', weight: 35 }, { term: 'slurry disposal', weight: 35 }, { term: 'concrete recycling', weight: 30 }, { term: 'ready mix reclaimer', weight: 30 }, { term: 'washout facility', weight: 30 }, { term: 'slurry pond', weight: 30 }, { term: 'concrete waste disposal', weight: 30 }, { term: 'pH neutralization', weight: 25 }, { term: 'concrete slurry', weight: 25 }, { term: 'reclaimer station', weight: 25 }, { term: 'concrete aggregate', weight: 20 }], secondary: [{ term: 'construction waste', weight: 15 }, { term: 'inert debris', weight: 15 }, { term: 'C&D disposal', weight: 15 }, { term: 'transfer station', weight: 10 }, { term: 'recycling center', weight: 10 }, { term: 'concrete crushing', weight: 20 }, { term: 'aggregate recycling', weight: 20 }] },
  hydro_excavation: { primary: [{ term: 'hydrovac disposal', weight: 35 }, { term: 'vac truck disposal', weight: 35 }, { term: 'excavation spoils', weight: 30 }, { term: 'soil disposal', weight: 30 }, { term: 'liquid waste disposal', weight: 30 }, { term: 'non-hazardous liquid', weight: 25 }, { term: 'industrial liquid waste', weight: 30 }, { term: 'wastewater disposal', weight: 25 }], secondary: [{ term: 'transfer station', weight: 15 }, { term: 'liquid waste facility', weight: 20 }, { term: 'waste processor', weight: 15 }, { term: 'tank cleaning', weight: 15 }] },
  asbestos_abatement: { primary: [{ term: 'asbestos disposal', weight: 40 }, { term: 'hazardous waste landfill', weight: 35 }, { term: 'Class I landfill', weight: 35 }, { term: 'RCRA disposal', weight: 35 }, { term: 'asbestos landfill', weight: 40 }, { term: 'regulated asbestos', weight: 35 }, { term: 'friable asbestos', weight: 30 }, { term: 'hazmat disposal', weight: 25 }], secondary: [{ term: 'hazardous waste', weight: 20 }, { term: 'Class II landfill', weight: 20 }, { term: 'manifest required', weight: 15 }, { term: 'TSDF', weight: 25 }] },
  hazardous_soil_remediation: { primary: [{ term: 'contaminated soil', weight: 40 }, { term: 'hazardous soil disposal', weight: 40 }, { term: 'impacted soil', weight: 35 }, { term: 'petroleum contaminated', weight: 35 }, { term: 'Class I landfill', weight: 35 }, { term: 'hazardous waste landfill', weight: 35 }, { term: 'RCRA Treatment', weight: 30 }, { term: 'TSDF', weight: 30 }, { term: 'soil bioremediation', weight: 25 }], secondary: [{ term: 'bioremediation', weight: 20 }, { term: 'thermal desorption', weight: 25 }, { term: 'soil washing', weight: 20 }, { term: 'excavated soil', weight: 15 }] },
  industrial_wastewater: { primary: [{ term: 'wastewater treatment', weight: 35 }, { term: 'industrial pretreatment', weight: 35 }, { term: 'POTW', weight: 35 }, { term: 'liquid waste treatment', weight: 30 }, { term: 'effluent treatment', weight: 30 }, { term: 'wastewater disposal', weight: 30 }, { term: 'industrial discharge', weight: 25 }, { term: 'leachate disposal', weight: 30 }, { term: 'non-hazardous liquid waste', weight: 25 }], secondary: [{ term: 'treatment plant', weight: 20 }, { term: 'waste treatment facility', weight: 20 }, { term: 'lagoon disposal', weight: 15 }] },
  medical_waste: { primary: [{ term: 'medical waste disposal', weight: 40 }, { term: 'biohazard waste', weight: 40 }, { term: 'regulated medical waste', weight: 40 }, { term: 'RMW disposal', weight: 35 }, { term: 'autoclave facility', weight: 35 }, { term: 'medical waste treatment', weight: 35 }, { term: 'sharps disposal', weight: 30 }, { term: 'pathological waste', weight: 30 }, { term: 'pharmaceutical disposal', weight: 30 }], secondary: [{ term: 'infectious waste', weight: 25 }, { term: 'biohazard collection', weight: 20 }, { term: 'medical autoclave', weight: 25 }, { term: 'healthcare waste', weight: 20 }] },
  industrial_demolition: { primary: [{ term: 'C&D disposal', weight: 35 }, { term: 'construction debris', weight: 30 }, { term: 'inert debris landfill', weight: 35 }, { term: 'concrete disposal', weight: 30 }, { term: 'demolition debris', weight: 35 }, { term: 'concrete crushing', weight: 30 }, { term: 'aggregate recycling', weight: 25 }, { term: 'scrap metal recycling', weight: 25 }, { term: 'concrete recycling yard', weight: 30 }], secondary: [{ term: 'recycling center', weight: 15 }, { term: 'transfer station', weight: 15 }, { term: 'scrap yard', weight: 20 }, { term: 'metal recycler', weight: 15 }] },
  industrial_sandblasting: { primary: [{ term: 'spent abrasive', weight: 40 }, { term: 'blast media disposal', weight: 40 }, { term: 'abrasive waste', weight: 35 }, { term: 'spent media', weight: 35 }, { term: 'sandblast waste', weight: 35 }, { term: 'hazardous waste disposal', weight: 25 }, { term: 'lead paint waste', weight: 30 }], secondary: [{ term: 'industrial waste disposal', weight: 20 }, { term: 'contaminated media', weight: 20 }] },
  tank_testing: { primary: [{ term: 'UST removal', weight: 35 }, { term: 'tank disposal', weight: 35 }, { term: 'petroleum contaminated', weight: 30 }, { term: 'contaminated soil', weight: 30 }, { term: 'petroleum waste', weight: 30 }, { term: 'UST closure', weight: 35 }, { term: 'underground tank disposal', weight: 30 }, { term: 'free product removal', weight: 25 }], secondary: [{ term: 'environmental disposal', weight: 20 }, { term: 'petroleum cleanup', weight: 20 }] },
  stormwater_swppp: { primary: [{ term: 'sediment disposal', weight: 35 }, { term: 'stormwater basin cleaning', weight: 35 }, { term: 'catch basin disposal', weight: 30 }, { term: 'sediment basin', weight: 30 }, { term: 'stormwater treatment', weight: 30 }, { term: 'BMP disposal', weight: 25 }], secondary: [{ term: 'liquid waste', weight: 15 }, { term: 'non-hazardous waste', weight: 15 }, { term: 'transfer station', weight: 10 }] },
  dewatering: { primary: [{ term: 'construction dewatering disposal', weight: 35 }, { term: 'groundwater disposal', weight: 35 }, { term: 'pump discharge', weight: 25 }, { term: 'dewatering treatment', weight: 30 }, { term: 'bypass pumping discharge', weight: 25 }, { term: 'water discharge permit', weight: 25 }], secondary: [{ term: 'wastewater disposal', weight: 20 }, { term: 'liquid waste', weight: 15 }] },
};

const NATIONAL_DISPOSAL_OPERATORS_DATA = [
  { term: 'clean harbors', weight: 35 },
  { term: 'republic services', weight: 35 },
  { term: 'waste management', weight: 35 },
  { term: 'casella', weight: 30 },
  { term: 'covanta', weight: 30 },
  { term: 'veolia', weight: 30 },
  { term: 'stericycle', weight: 35 },
  { term: 'us ecology', weight: 30 },
  { term: 'heritage crystal', weight: 25 },
  { term: 'envirostar', weight: 25 },
  { term: 'recology', weight: 35 },
  { term: 'norcal waste', weight: 30 },
  { term: 'greenwaste', weight: 30 },
  { term: 'bay area recycling', weight: 30 },
  { term: 'bay waste', weight: 25 },
  { term: 'golden gate disposal', weight: 30 },
  { term: 'santek', weight: 25 },
  { term: 'advanced disposal', weight: 25 },
  { term: 'arrow disposal', weight: 25 },
  { term: 'lauber waste', weight: 25 },
  { term: 'aptus', weight: 25 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────────

function inferMatchType(weight: number): 'exact' | 'fuzzy' | 'weak' {
  if (weight >= 80) return 'exact';
  if (weight >= 50) return 'fuzzy';
  return 'weak';
}

function aliasWithMeta(alias: string, weight: number): { alias: string; weight: number; confidenceWeight: number; matchType: 'exact' | 'fuzzy' | 'weak' } {
  return {
    alias,
    weight,
    confidenceWeight: weight,
    matchType: inferMatchType(weight),
  };
}

// ── Build seed entries ────────────────────────────────────────────────────────

const seeds: OntologySeedEntry[] = [];

function addEquipment() {
  for (const [canonicalId, aliases] of Object.entries(EQUIPMENT_ONTOLOGY)) {
    seeds.push({
      canonicalId,
      entityType: 'equipment',
      source: 'manual_seed',
      label: canonicalId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      aliases: aliases.map(a => aliasWithMeta(a, 100)),
    });
  }
}

function addServices() {
  for (const [verticalId, services] of Object.entries(VERTICAL_SERVICE_ONTOLOGY)) {
    for (const [canonicalId, aliases] of Object.entries(services)) {
      seeds.push({
        canonicalId,
        entityType: 'service',
        verticalId,
        source: 'manual_seed',
        label: canonicalId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        aliases: aliases.map(a => aliasWithMeta(a, 100)),
      });
    }
  }
}

function addWasteTypes() {
  const wasteTypes: OntologySeedEntry[] = [
    {
      canonicalId: 'hazardous_waste',
      entityType: 'waste',
      source: 'manual_seed',
      label: 'Hazardous Waste',
      aliases: [
        aliasWithMeta('hazardous waste', 100),
        aliasWithMeta('hazmat', 90),
        aliasWithMeta('asbestos', 80),
        aliasWithMeta('lead paint', 70),
      ],
    },
    {
      canonicalId: 'medical_waste',
      entityType: 'waste',
      source: 'manual_seed',
      label: 'Medical Waste',
      aliases: [
        aliasWithMeta('medical waste', 100),
        aliasWithMeta('biohazard', 90),
        aliasWithMeta('sharps', 80),
        aliasWithMeta('clinical waste', 80),
        aliasWithMeta('pathological waste', 70),
        aliasWithMeta('regulated medical waste', 90),
      ],
    },
    {
      canonicalId: 'concrete_slurry',
      entityType: 'waste',
      source: 'manual_seed',
      label: 'Concrete Slurry',
      aliases: [
        aliasWithMeta('concrete slurry', 100),
        aliasWithMeta('slurry waste', 80),
      ],
    },
    {
      canonicalId: 'contaminated_soil',
      entityType: 'waste',
      source: 'manual_seed',
      label: 'Contaminated Soil',
      aliases: [
        aliasWithMeta('contaminated soil', 100),
        aliasWithMeta('petroleum contaminated soil', 90),
        aliasWithMeta('hydrocarbon soil', 80),
      ],
    },
    {
      canonicalId: 'industrial_wastewater',
      entityType: 'waste',
      source: 'manual_seed',
      label: 'Industrial Wastewater',
      aliases: [
        aliasWithMeta('industrial wastewater', 100),
        aliasWithMeta('effluent', 70),
        aliasWithMeta('sludge', 60),
        aliasWithMeta('industrial liquid waste', 80),
      ],
    },
  ];

  seeds.push(...wasteTypes);
}

function addDisposalServices() {
  // Per-vertical disposal signals as waste-type services
  for (const [verticalId, data] of Object.entries(VERTICAL_DISPOSAL_SIGNALS_DATA)) {
    const aliases = [
      ...data.primary.map(p => aliasWithMeta(p.term, p.weight)),
      ...data.secondary.map(s => aliasWithMeta(s.term, s.weight)),
    ];

    seeds.push({
      canonicalId: `${verticalId}_disposal`,
      entityType: 'service',
      verticalId,
      source: 'manual_seed',
      label: `${verticalId.replace(/_/g, ' ')} Disposal`,
      aliases,
    });
  }

  // National operators as regulatory entities
  for (const op of NATIONAL_DISPOSAL_OPERATORS_DATA) {
    seeds.push({
      canonicalId: `operator_${op.term.replace(/[^a-z0-9]/g, '_')}`,
      entityType: 'regulatory',
      source: 'manual_seed',
      label: `${op.term.replace(/\b\w/g, c => c.toUpperCase())}`,
      aliases: [aliasWithMeta(op.term, op.weight)],
    });
  }

  // Apollo disposal signals as regulatory
  const apolloServices: OntologySeedEntry[] = DISPOSAL_APOLLO_SIGNALS.map(s => ({
    canonicalId: `apollo_${s.term.replace(/[^a-z0-9]/g, '_')}`,
    entityType: 'regulatory',
    source: 'manual_seed',
    label: s.term,
    aliases: [aliasWithMeta(s.term, s.weight)],
  }));
  seeds.push(...apolloServices);

  // Google disposal type signals
  for (const [googleType, signals] of Object.entries(DISPOSAL_GOOGLE_TYPE_SIGNALS)) {
    seeds.push({
      canonicalId: `google_${googleType}`,
      entityType: 'regulatory',
      source: 'manual_seed',
      label: googleType.replace(/_/g, ' '),
      aliases: signals.map(s => aliasWithMeta(s, 100)),
    });
  }
}

function addGoogleTypeSignals() {
  for (const [googleType, signals] of Object.entries(GOOGLE_TYPE_TO_VERTICAL_SIGNALS)) {
    seeds.push({
      canonicalId: `google_type_${googleType}`,
      entityType: 'regulatory',
      source: 'manual_seed',
      label: googleType.replace(/_/g, ' '),
      aliases: signals.map(s => aliasWithMeta(s.term, s.weight)),
    });
  }
}

addEquipment();
addServices();
addWasteTypes();
addDisposalServices();
addGoogleTypeSignals();

// ── Build relationship seeds ───────────────────────────────────────────────────

const relationshipSeeds: OntologyRelationshipSeed[] = [];

function buildEquipmentRelationships() {
  // Services that REQUIRE specific equipment
  const serviceEquipmentReqs: Record<string, string[]> = {
    slurry_removal: ['vacuum_truck'],
    slurry_recycling: ['slurry_separator'],
    hydro_excavation: ['hydrovac', 'vacuum_truck'],
    vacuum_truck_service: ['vacuum_truck'],
    concrete_pumping: ['concrete_pump'],
    concrete_crushing: ['concrete_crusher'],
    tank_testing: ['tank', 'pump'],
    sandblasting: ['sandblaster', 'compressor'],
    hydrostatic_testing: ['pump'],
    potholing: ['hydrovac'],
    dewatering: ['pump'],
    load_bank_testing: ['load_bank', 'generator'],
    generator_maintenance: ['generator'],
    pile_driving: ['pile_driver'],
    dredging: ['dredge'],
    structural_demolition: ['excavator', 'concrete_crusher'],
  };

  for (const [serviceId, equipmentIds] of Object.entries(serviceEquipmentReqs)) {
    for (const equipmentId of equipmentIds) {
      relationshipSeeds.push({
        sourceCanonicalId: serviceId,
        targetCanonicalId: equipmentId,
        relation: 'REQUIRES',
      });
    }
  }
}

function buildDisposalRelationships() {
  // Services that GENERATE waste
  const serviceWasteGen: Record<string, string[]> = {
    slurry_removal: ['concrete_slurry'],
    slurry_recycling: ['concrete_slurry'],
    concrete_washout: ['concrete_slurry'],
    concrete_cutting: ['concrete_slurry'],
    asbestos_removal: ['hazardous_waste'],
    hazmat_containment: ['hazardous_waste'],
    sandblasting: ['hazardous_waste'],
    medical_waste_collection: ['medical_waste'],
    biohazard_cleanup: ['medical_waste'],
    soil_excavation: ['contaminated_soil'],
    soil_remediation: ['contaminated_soil'],
    wastewater_treatment: ['industrial_wastewater'],
    lagoon_cleaning: ['industrial_wastewater'],
  };

  for (const [serviceId, wasteIds] of Object.entries(serviceWasteGen)) {
    for (const wasteId of wasteIds) {
      relationshipSeeds.push({
        sourceCanonicalId: serviceId,
        targetCanonicalId: wasteId,
        relation: 'GENERATES',
      });
    }
  }

  // Waste that is disposed at specific facility types
  const wasteDisposal: Record<string, string[]> = {
    concrete_slurry: ['slurry_processing_disposal'],
    hazardous_waste: ['asbestos_abatement_disposal', 'hazardous_soil_remediation_disposal'],
    medical_waste: ['medical_waste_disposal'],
    industrial_wastewater: ['industrial_wastewater_disposal'],
    contaminated_soil: ['hazardous_soil_remediation_disposal'],
  };

  for (const [wasteId, disposalIds] of Object.entries(wasteDisposal)) {
    for (const disposalId of disposalIds) {
      relationshipSeeds.push({
        sourceCanonicalId: wasteId,
        targetCanonicalId: disposalId,
        relation: 'DISPOSED_AT',
      });
    }
  }
}

buildEquipmentRelationships();
buildDisposalRelationships();

// ── Progress tracking ─────────────────────────────────────────────────────────

function dedupeSeeds(entries: OntologySeedEntry[]): OntologySeedEntry[] {
  const seen = new Set<string>();
  return entries.filter(e => {
    if (seen.has(e.canonicalId)) return false;
    seen.add(e.canonicalId);
    return true;
  });
}

const DEDUPED_SEEDS = dedupeSeeds(seeds);

// ── Import helpers and run ─────────────────────────────────────────────────────

async function upsertEntity(seed: OntologySeedEntry): Promise<string | null> {
  const body: Record<string, unknown> = {
    canonical_id: seed.canonicalId,
    entity_type: seed.entityType,
    vertical_id: seed.verticalId || null,
    label: seed.label,
    description: seed.description || null,
    active: true,
  };
  if (seed.source) body.source = seed.source;

  const res = await supabaseFetch('/rest/v1/ontology_entities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`  [FAIL] ${seed.canonicalId}: ${text}`);
    return null;
  }

  // Fetch the entity id
  const fetchRes = await supabaseFetch(
    `/rest/v1/ontology_entities?canonical_id=eq.${encodeURIComponent(seed.canonicalId)}&select=id&limit=1`,
  );
  if (!fetchRes.ok) return null;
  const rows = await fetchRes.json();
  return rows?.[0]?.id || null;
}

async function upsertAliases(entityId: string, seed: OntologySeedEntry): Promise<void> {
  // Delete existing aliases for this entity
  await supabaseFetch(
    `/rest/v1/ontology_aliases?entity_id=eq.${entityId}`,
    { method: 'DELETE' },
  );

  // Insert fresh aliases with new fields
  for (const a of seed.aliases) {
    const aliasBody: Record<string, unknown> = {
      entity_id: entityId,
      alias: a.alias,
      language_code: (a as any).languageCode || 'en',
      weight: a.weight ?? 100,
      confidence_weight: (a as any).confidenceWeight ?? a.weight ?? 100,
      match_type: (a as any).matchType || 'exact',
      source: seed.source || 'manual_seed',
    };

    await supabaseFetch('/rest/v1/ontology_aliases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(aliasBody),
    });
  }
}

async function upsertRelationship(r: OntologyRelationshipSeed): Promise<void> {
  // Look up entity IDs from canonical IDs
  const [srcRes, tgtRes] = await Promise.all([
    supabaseFetch(`/rest/v1/ontology_entities?canonical_id=eq.${encodeURIComponent(r.sourceCanonicalId)}&select=id&limit=1`),
    supabaseFetch(`/rest/v1/ontology_entities?canonical_id=eq.${encodeURIComponent(r.targetCanonicalId)}&select=id&limit=1`),
  ]);

  if (!srcRes.ok || !tgtRes.ok) {
    console.warn(`  [SKIP] ${r.sourceCanonicalId} -> ${r.targetCanonicalId}: entity not found`);
    return;
  }

  const [srcRows, tgtRows] = await Promise.all([srcRes.json(), tgtRes.json()]);
  const srcId = srcRows?.[0]?.id;
  const tgtId = tgtRows?.[0]?.id;

  if (!srcId || !tgtId) {
    console.warn(`  [SKIP] ${r.sourceCanonicalId} -> ${r.targetCanonicalId}: missing entity ID`);
    return;
  }

  await supabaseFetch('/rest/v1/ontology_relationships', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      source_entity_id: srcId,
      target_entity_id: tgtId,
      relation: r.relation,
    }),
  });
}

async function main() {
  console.log(`\nSeeding ${DEDUPED_SEEDS.length} entities into ontology tables...\n`);

  let entityCount = 0;
  let aliasCount = 0;

  for (const seed of DEDUPED_SEEDS) {
    const entityId = await upsertEntity(seed);
    if (entityId) {
      entityCount++;
      await upsertAliases(entityId, seed);
      aliasCount += seed.aliases.length;
    }
    process.stdout.write('.');
  }

  console.log(`\n  Entities: ${entityCount}`);
  console.log(`  Aliases: ${aliasCount}`);

  console.log(`\nSeeding ${relationshipSeeds.length} relationships...\n`);

  let relCount = 0;
  for (const r of relationshipSeeds) {
    await upsertRelationship(r);
    relCount++;
    process.stdout.write('.');
  }

  console.log(`\n  Relationships: ${relCount}`);
  console.log(`\nDone. Total stats:`);
  console.log(`  Entities: ${entityCount}`);
  console.log(`  Aliases: ${aliasCount}`);
  console.log(`  Relationships: ${relCount}`);

  // Invalidate Redis cache so fresh data loads
  // (fire-and-forget — cache will rebuild on next loadOntology call)
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (redisUrl && redisToken) {
    console.log('\nInvalidating Redis cache...');
    await fetch(`${redisUrl}/del/ontology:global`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${redisToken}` },
    });
    console.log('  Done.');
  }
}

main().catch(console.error);
