export interface RegulatoryFacility {
  id: string;
  swisNumber: string;
  facilityName: string;
  operatorName?: string;
  streetAddress?: string;
  city?: string;
  state: string;
  zip?: string;
  county?: string;
  latitude?: number;
  longitude?: number;
  permitStatus: string;
  regulatoryStatus: string;
  activities: string[];
  wasteTypes: string[];
  vertical: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
  rawPayload?: Record<string, unknown>;
  importedAt: string;
}

export interface SwisSite {
  swisNumber: string;
  name: string;
  latitude: string;
  longitude: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  siteOperationalStatus: string;
  siteRegulatoryStatus: string;
  isInertDebris: string;
  reportingAgency: string;
}

export interface SwisActivity {
  swisNumber: string;
  siteName: string;
  activity: string;
  activityCategory: string;
  activityClassification: string;
}

export interface SwisWaste {
  swisNumber: string;
  siteName: string;
  activity: string;
  wasteType: string;
}

export interface SwisOperator {
  swisNumber: string;
  siteName: string;
  operatorName: string;
  operatorPhone: string;
  operatorStreetAddress: string;
  operatorCity: string;
  operatorState: string;
  operatorZip: string;
}
