import { VerticalConfig } from '@/types/config';

export type SignalEventType =
  | 'NEW_PERMIT_FOUND'
  | 'NEW_BID_POSTED'
  | 'VENDOR_RATING_UPDATED'
  | 'USER_FEEDBACK'
  | 'NEW_LISTING_DISCOVERED'
  | 'COMPLIANCE_STATUS_CHANGE'
  | 'VENDOR_AVAILABILITY_CHANGE'
  | 'SCRAPE_COMPLETED';

export interface SignalEvent {
  id: string;
  eventType: SignalEventType;
  vendorId: string;
  verticalId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface VendorChangePayload {
  vendorId: string;
  eventType: SignalEventType;
  newData: Partial<{
    permits: string[];
    services: string[];
    languages: string[];
    location: { lat: number; lng: number };
    rating: number;
    reviewCount: number;
    availability: boolean;
    complianceStatus: string;
    bidCount: number;
  }>;
}

export interface ImpactedTenants {
  verticalIds: string[];
  reason: string;
}

export function resolveImpactedTenants(
  vendorId: string,
  event: SignalEvent,
  allTenants: Map<string, { verticals: string[] }>,
): ImpactedTenants {
  const impacted: string[] = [];
  for (const [tenantId, profile] of allTenants) {
    if (profile.verticals.some(v => v === event.verticalId)) {
      impacted.push(tenantId);
    }
  }
  return {
    verticalIds: impacted,
    reason: `${event.eventType} for vendor ${vendorId} in vertical ${event.verticalId}`,
  };
}

export function getTenantVerticalsAffectedByEvent(
  eventType: SignalEventType,
  vendorVerticals: string[],
  config: VerticalConfig,
): string[] {
  const verticalAffinity: Partial<Record<SignalEventType, string[]>> = {
    NEW_PERMIT_FOUND: ['slurry_processing', 'industrial_wastewater', 'tank_testing', 'stormwater_compliance'],
    NEW_BID_POSTED: [],
    USER_FEEDBACK: [],
    NEW_LISTING_DISCOVERED: [],
    COMPLIANCE_STATUS_CHANGE: ['asbestos_abatement', 'industrial_wastewater', 'tank_testing'],
    VENDOR_AVAILABILITY_CHANGE: [],
    SCRAPE_COMPLETED: [],
    VENDOR_RATING_UPDATED: [],
  };

  const broadMatch = vendorVerticals.filter(v => {
    const affinity = verticalAffinity[eventType];
    return !affinity || affinity.length === 0 || affinity.includes(v);
  });
  return broadMatch.length > 0 ? broadMatch : vendorVerticals;
}
