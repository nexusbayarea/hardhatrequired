import type { Permit, PermitStatus } from './company';

export type FitType = 'DIRECT_OPERATOR' | 'INDIRECT_VENDOR' | 'DISPOSAL_NODE' | 'REGULATORY_NODE';

export type { Permit, PermitStatus };

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapLinks {
  googleMaps: string;
  appleMaps: string;
  waze: string;
}

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
  coordinates?: Coordinates
  navigation?: MapLinks
}
