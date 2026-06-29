import { CRMStatus, PriorityGroup, InteractionType, OutreachOutcome } from './company';

export interface AcquireQueuePayload {
  pCampaignId: string;
  pAgentId: string;
  pLimit?: number;
}

export interface OutreachQueueItem {
  companyId: string;
  companyName: string;
  website?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  priorityGroup: PriorityGroup;
  enrichmentScore: number;
  currentStatus: CRMStatus;
  capabilitySummary?: string;
}

export interface SubmitInteractionLogPayload {
  campaignId: string;
  companyId: string;
  contactId?: string;
  interactionType: InteractionType;
  outcome: OutreachOutcome;
  notes?: string;
}

export interface CampaignPerformanceStats {
  totalAssignedLeads: number;
  totalCompletedInteractions: number;
  callsMade: number;
  emailsSent: number;
  positiveConnections: number;
  rejections: number;
  connectionRatio: number;
  conversionToInterestRatio: number;
}
