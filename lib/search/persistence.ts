import { logger } from '@/lib/logger';
import { supabaseFetch } from '@/lib/db';

export interface SavedSearch {
  id: string;
  organizationId: string;
  verticalSlug: string;
  filters: Record<string, unknown>;
  resultCount: number;
  createdAt: string;
}

export async function saveSearch(params: {
  organizationId: string;
  verticalSlug: string;
  filters: Record<string, unknown>;
  resultCount: number;
}): Promise<SavedSearch | null> {
  try {
    const res = await supabaseFetch('/rest/v1/saved_searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
      body: JSON.stringify({
        organization_id: params.organizationId,
        vertical_slug: params.verticalSlug,
        filters: params.filters,
        result_count: params.resultCount
      })
    });

    if (!res.ok) {
      logger.error('Failed to persist search to DB', {
        route: 'search/persistence',
        data: { status: res.status }
      });
      return null;
    }

    const dbSearch = await res.json();
    return {
      id: dbSearch[0]?.id,
      organizationId: dbSearch[0]?.organization_id,
      verticalSlug: dbSearch[0]?.vertical_slug,
      filters: dbSearch[0]?.filters,
      resultCount: dbSearch[0]?.result_count,
      createdAt: dbSearch[0]?.created_at
    };
  } catch (err) {
    logger.error('Search persistence error', {
      route: 'search/persistence',
      error: String(err)
    });
    return null;
  }
}

export async function getSearchHistory(organizationId: string): Promise<SavedSearch[]> {
  try {
    const res = await supabaseFetch(
      `/rest/v1/saved_searches?organization_id=eq.${organizationId}&order=created_at.desc&limit=50`
    );

    if (!res.ok) return [];

    const data = await res.json();
    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      verticalSlug: row.vertical_slug,
      filters: row.filters,
      resultCount: row.result_count,
      createdAt: row.created_at
    }));
  } catch (err) {
    logger.error('Search history fetch error', {
      route: 'search/persistence',
      error: String(err)
    });
    return [];
  }
}
