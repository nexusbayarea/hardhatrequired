export type CRMStatus =
  | 'NOT_CONTACTED'
  | 'CALLED'
  | 'EMAILED'
  | 'INTERESTED'
  | 'FOLLOW_UP'
  | 'QUALIFIED'
  | 'WON'
  | 'LOST';

export type PriorityGroup = 'A' | 'B' | 'C' | 'D';

export type InteractionType = 'CALL' | 'EMAIL' | 'LINKEDIN' | 'NOTE';

export type OutreachOutcome =
  | 'no_answer'
  | 'left_voicemail'
  | 'busy'
  | 'connected_interested'
  | 'connected_not_interested'
  | 'sent_proposal'
  | 'out_of_service';

export interface Company {
  id: string;
  organizationId: string;
  verticalId: string;
  companyName: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  distanceMiles?: number;
  hasRegulatoryPermit?: boolean;
  googleCategorySignals?: string[];
  googlePrimaryType?: string;
  googleTypes?: string[];
  googleRating?: number;
  googleReviewCount?: number;
  apolloDescription?: string;
  enrichmentScore: number;
  priority: PriorityGroup;
  status: CRMStatus;
  capabilitySummary?: string;
  matchedSignals?: string[];
  negativeHits?: string[];
  relevanceReason?: string;
  confidence?: number;
  feedbackPositiveCount?: number;
  feedbackNegativeCount?: number;
  scrapedIsCommercial?: boolean;
  scrapedIsResidential?: boolean;
  scrapedIsMismatch?: boolean;
  scrapedKeywords?: string[];
  scrapedLicenseNumbers?: string[];
  notes?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  companyId: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  organizationId: string;
  verticalId: string;
  name: string;
  zipCode: string;
  radiusMiles: number;
  resultCount: number;
  createdAt: string;
}

export interface OutreachLog {
  id: string;
  organizationId: string;
  companyId: string;
  contactId?: string;
  campaignId?: string;
  interactionType: InteractionType;
  outcome?: OutreachOutcome;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface SearchFilters {
  zip: string;
  radius: number;
}
