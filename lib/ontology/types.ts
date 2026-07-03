import { FitType } from '@/types/company';

export type OntologyEntityType = 'service' | 'equipment' | 'waste' | 'regulatory' | 'material';

export type MatchType = 'exact' | 'fuzzy' | 'weak' | 'synonym' | 'stemmed';

export type OntologySource = 'manual_seed' | 'scraper_discovery' | 'tenant_custom' | 'ai_generated' | 'api_import';

export interface OntologyVersion {
  id: number;
  verticalId: string;
  createdAt: string;
}

export interface OntologyEntity {
  id?: string;
  canonicalId: string;
  entityType: OntologyEntityType;
  verticalId?: string;
  label: string;
  description?: string;
  source?: OntologySource;
  active?: boolean;
}

export interface OntologyAlias {
  id?: string;
  entityId?: string;
  alias: string;
  languageCode?: string;
  weight?: number;
  confidenceWeight?: number;
  matchType?: MatchType;
  source?: OntologySource;
  organizationId?: string;
}

export interface OntologyRelationship {
  sourceCanonicalId: string;
  targetCanonicalId: string;
  relation: string;
  metadata?: Record<string, unknown>;
}

export interface AliasMeta {
  canonicalId: string;
  weight: number;
  confidenceWeight: number;
  entityType: OntologyEntityType;
  matchType: MatchType;
  source: OntologySource;
  organizationId?: string;
}

export interface CompiledOntologyEntry {
  canonicalId: string;
  entityType: OntologyEntityType;
  verticalId?: string;
  aliases: { phrase: string; weight: number; confidenceWeight: number; matchType: MatchType; source: OntologySource }[];
}

export interface CompiledOntology {
  entries: CompiledOntologyEntry[];
  aliasMap: Map<string, AliasMeta>;
  verticalIndex: Map<string, string[]>;
  typeIndex: Map<OntologyEntityType, string[]>;
  version: number;
}

export interface OntologyMatch {
  canonicalId: string;
  matchedAlias: string;
  weight: number;
  confidenceWeight: number;
  entityType: OntologyEntityType;
  matchType: MatchType;
  source: OntologySource;
}

export interface ConstraintResult {
  valid: boolean;
  missingDependencies: string[];
  confidencePenalty: number;
  reason: string;
}

export interface OntologySeedEntry {
  canonicalId: string;
  entityType: OntologyEntityType;
  verticalId?: string;
  label: string;
  description?: string;
  source?: OntologySource;
  aliases: { alias: string; languageCode?: string; weight?: number; confidenceWeight?: number; matchType?: MatchType }[];
}

export interface OntologyRelationshipSeed {
  sourceCanonicalId: string;
  targetCanonicalId: string;
  relation: string;
}
