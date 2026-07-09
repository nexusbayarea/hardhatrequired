import type { SearchPane } from '../types';

export interface SearchParams {
  vertical: string;
  zip: string;
  radius: number;
  mode: SearchPane;
  gallons?: number;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  grade: string;
  score: number;
  distance: number;
  signals: string[];
  confidence: number;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  source?: string;
  rating?: number;
  permits?: string[];
  licenses?: string[];
  capabilitySummary?: string;
  aiSummary?: string;
  relevanceReason?: string;
  matchedSignals?: string[];
  negativeHits?: string[];
  coordinates?: { lat: number; lng: number };
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  total: number;
  mode: SearchPane;
  timing?: Record<string, number>;
}

export async function executeSearch(params: SearchParams): Promise<SearchResponse> {
  const res = await fetch('/api/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}
