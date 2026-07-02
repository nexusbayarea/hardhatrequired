// ─── HardHatRequired (HHR) — Multi-Index Search Types ────────────────────────
//
// The HHR platform exposes 6 distinct search indexes, each returning a typed
// result shape. All indexes share the same base fields (id, name, location,
// distance, score, grade) and extend with index-specific fields.
// ──────────────────────────────────────────────────────────────────────────────

export type HHRGrade = 'A' | 'B' | 'C' | 'D';

export type HHRIndexType =
  | 'labor'
  | 'disposal'
  | 'equipment_rental'
  | 'equipment_purchase'
  | 'bid_intelligence'
  | 'compliance';

// ── Shared base for all index results ────────────────────────────────────────

export interface HHRBaseResult {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  phone?: string;
  website?: string;
  email?: string;
  score: number;
  grade: HHRGrade;
  source: string;
  verticalId: string;
  matchedSignals: string[];
  createdAt: string;
}

// ── D1: Labor Index ───────────────────────────────────────────────────────────
// Certified contractors, operators, specialty crews, inspectors, engineers

export type LaborCategory =
  | 'certified_contractor'
  | 'operator'
  | 'specialty_crew'
  | 'inspector'
  | 'engineer';

export interface LaborResult extends HHRBaseResult {
  index: 'labor';
  category: LaborCategory;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpiry?: string;
  certifications?: string[];
  crewSize?: number;
  serviceRadius?: number;
  unionAffiliated?: boolean;
  languages?: string[];
  specialties?: string[];
}

// ── D2: Disposal Index ────────────────────────────────────────────────────────
// Landfills, recyclers, treatment facilities, waste processors, EPA sites

export type DisposalCategory =
  | 'landfill'
  | 'recycler'
  | 'treatment_facility'
  | 'waste_processor'
  | 'epa_disposal_site';

export interface DisposalResult extends HHRBaseResult {
  index: 'disposal';
  category: DisposalCategory;
  acceptedWasteTypes?: string[];
  capacityTonsPerDay?: number;
  epaId?: string;
  permitNumber?: string;
  permitState?: string;
  tippingFeePerTon?: number;
  minimumLoad?: string;
  hoursOfOperation?: string;
  requiresManifest?: boolean;
  hazmatCertified?: boolean;
}

// ── D3: Equipment Rental Index ────────────────────────────────────────────────
// Vac trucks, hydrovacs, generators, shoring, lifts, heavy equipment

export type RentalEquipmentType =
  | 'vac_truck'
  | 'hydrovac'
  | 'generator'
  | 'shoring_equipment'
  | 'lift'
  | 'heavy_equipment'
  | 'other';

export interface EquipmentRentalResult extends HHRBaseResult {
  index: 'equipment_rental';
  equipmentTypes: RentalEquipmentType[];
  availableUnits?: number;
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  requiresCDL?: boolean;
  operatorIncluded?: boolean;
  deliveryAvailable?: boolean;
  deliveryRadius?: number;
  minimumRentalDays?: number;
  inventoryLastUpdated?: string;
}

// ── D4: Equipment Purchase Index ──────────────────────────────────────────────
// Dealers, used equipment, auctions, manufacturers

export type PurchaseCategory =
  | 'dealer'
  | 'used_equipment'
  | 'auction'
  | 'manufacturer';

export interface EquipmentPurchaseResult extends HHRBaseResult {
  index: 'equipment_purchase';
  category: PurchaseCategory;
  brands?: string[];
  acceptsTrades?: boolean;
  financingAvailable?: boolean;
  warrantyOffered?: boolean;
  auctionDate?: string;
  auctionUrl?: string;
  inventoryCount?: number;
  serviceCenter?: boolean;
}

// ── D5: Bid Intelligence Index ────────────────────────────────────────────────
// City bids, county bids, state DOT, utilities, private contracts

export type BidSource =
  | 'city'
  | 'county'
  | 'state_dot'
  | 'utility'
  | 'private';

export type BidStatus =
  | 'open'
  | 'closing_soon'
  | 'closed'
  | 'awarded'
  | 'cancelled';

export interface BidResult {
  id: string;
  index: 'bid_intelligence';
  title: string;
  agency: string;
  source: BidSource;
  status: BidStatus;
  bidNumber?: string;
  description?: string;
  verticalId: string;
  state: string;
  county?: string;
  city?: string;
  estimatedValue?: number;
  publishedAt?: string;
  dueAt?: string;
  awardedAt?: string;
  awardedTo?: string;
  awardedAmount?: number;
  documentUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  naicsCodes?: string[];
  score: number;
  grade: HHRGrade;
  matchedSignals: string[];
  createdAt: string;
}

// ── D6: Compliance Index (extends existing IIE compliance) ────────────────────

export type ComplianceCategory =
  | 'osha'
  | 'epa'
  | 'state_regulation'
  | 'local_code'
  | 'permit';

export interface ComplianceResult {
  id: string;
  index: 'compliance';
  category: ComplianceCategory;
  title: string;
  description: string;
  jurisdiction: string;
  state?: string;
  effectiveDate?: string;
  expiryDate?: string;
  penaltyAmount?: number;
  documentUrl?: string;
  verticalIds: string[];
  tags: string[];
  createdAt: string;
}

// ── Unified search request ────────────────────────────────────────────────────

export interface HHRSearchRequest {
  indexes: HHRIndexType[];
  verticalId: string;
  zip: string;
  radiusMiles?: number;
  query?: string;
  filters?: Record<string, unknown>;
}

export interface HHRSearchResponse {
  labor?: LaborResult[];
  disposal?: DisposalResult[];
  equipment_rental?: EquipmentRentalResult[];
  equipment_purchase?: EquipmentPurchaseResult[];
  bid_intelligence?: BidResult[];
  compliance?: ComplianceResult[];
  meta: {
    totalResults: number;
    byIndex: Record<HHRIndexType, number>;
    executionMs: number;
    zip: string;
    radiusMiles: number;
    verticalId: string;
  };
}
