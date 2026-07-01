import type { Permit, PermitStatus } from './company';

export type FitType = 'DIRECT_OPERATOR' | 'INDIRECT_VENDOR' | 'DISPOSAL_NODE' | 'REGULATORY_NODE';

export type { Permit, PermitStatus };

export type SearchResult = {
  id: string
  companyName: string
  address: string | null
  phone: string | null
  website: string | null
  distanceMiles: number | null
  leadScore: number
  grade: 'A' | 'B' | 'C' | 'D'
  confidence: number | null
  fitType: FitType | null
  capabilitySummary: string | null
  permits?: Permit[]
}
