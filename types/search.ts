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

export interface SignalMatch {
  id: string;
  confidence: number;
}

export interface LogisticsEstimates {
  oneWayTransitTimeMins: number;
  totalRoundTripMins: number;
  haulingCost: number;
  disposalCost: number;
  totalCost: number;
  costPerGallon: number;
}

export type SearchResult = {
  id: string
  companyName: string
  address: string | null
  phone: string | null
  website: string | null
  email?: string | null
  distanceMiles: number | null
  leadScore: number
  grade: 'A' | 'B' | 'C' | 'D'
  confidence: number | null
  fitType: FitType | null
  capabilitySummary: string | null
  permits?: Permit[]
  coordinates?: Coordinates
  navigation?: MapLinks
  extractedServices?: SignalMatch[]
  extractedEquipment?: SignalMatch[]
  scrapedLicenseNumbers?: string[]
  scrapedKeywords?: string[]
  matchedSignals?: string[]
  negativeHits?: string[]
  relevanceReason?: string | null
  source?: string | null
  googleRating?: number | null
  googleReviewCount?: number | null
  extractionConfidence?: number | null
  aiSummary?: string | null
  logisticsEstimates?: LogisticsEstimates | null
}
