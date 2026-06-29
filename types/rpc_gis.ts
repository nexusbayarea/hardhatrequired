import { CRMStatus, PriorityGroup } from './company';

/**
 * Payload parameters required by `public.search_companies_by_radius` rpc.
 */
export interface GeospatialSearchPayload {
  pCenterLat: number;
  pCenterLon: number;
  pRadiusMiles: number;
  pVerticalId?: string | null;
  pSearchQuery?: string | null;
}

/**
 * Standard output row structure returned from the database-level spatial query engine.
 */
export interface GeospatialProspectResult {
  id: string;
  companyName: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude: number;
  longitude: number;
  distanceMiles: number;
  priorityGroup: PriorityGroup;
  status: CRMStatus;
  capabilitySummary?: string;
  searchRank: number;
}
