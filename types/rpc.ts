import { CRMStatus, PriorityGroup, Company, Contact } from './company';

/**
 * Maps the payload structure accepted by the atomic bulk-import procedure:
 * `public.upsert_market_leads(p_companies JSONB)`
 */
export interface BulkUpsertLeadPayload extends Partial<Company> {
  companyName: string;
  verticalId: string;
  enrichmentScore?: number;
  priorityGroup?: PriorityGroup;
  status?: CRMStatus;
  contacts?: Array<Partial<Contact> & { isPrimary?: boolean }>;
}

/**
 * Standardized mapping matching the execution output schema from:
 * `SELECT * FROM public.get_tenant_metrics()`
 * Enables mathematical conversion visualization using standard LaTeX modeling.
 */
export interface TenantPipelineMetrics {
  totalLeads: number;
  priorityALeads: number;
  priorityBLeads: number;
  priorityCLeads: number;
  contactEnrichmentPercentage: number;
  contactedLeads: number;
  interestedLeads: number;
  wonDeals: number;
  pipelineConversionRate: number;
}

/**
 * Quota metadata boundaries returned on billing limit verifications
 */
export interface QuotaAllocationStatus {
  tier: 'starter' | 'pro' | 'enterprise';
  maxLeadsAllowed: number;
  currentLeadsCount: number;
  remainingAllowance: number;
}
