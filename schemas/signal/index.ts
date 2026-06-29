export type OutreachStatus =
    | 'not_contacted'
    | 'called'
    | 'emailed'
    | 'follow_up'
    | 'interested'
    | 'closed';

export interface Signal {
    status: OutreachStatus;
    priority?: 'A' | 'B' | 'C';
    score?: number;
    enrichmentScore?: number;
    source?: string;
    notes?: string;
}
