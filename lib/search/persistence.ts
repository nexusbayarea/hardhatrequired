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

const inMemoryStore: SavedSearch[] = [];

export async function saveSearch(params: {
  organizationId: string;
  verticalSlug: string;
  filters: Record<string, unknown>;
  resultCount: number;
}): Promise<SavedSearch | null> {
  const search: SavedSearch = {
    id: `search-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    organizationId: params.organizationId,
    verticalSlug: params.verticalSlug,
    filters: params.filters,
    resultCount: params.resultCount,
    createdAt: new Date().toISOString()
  };

  try {
    const res = await supabaseFetch('/rest/v1/saved_searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: params.organizationId,
        vertical_slug: params.verticalSlug,
        filters: params.filters,
        result_count: params.resultCount
      })
    });

    if (!res.ok) {
      logger.warn('Failed to persist search to DB, using in-memory', {
        route: 'search/persistence',
        status: res.status
      });
      inMemoryStore.unshift(search);
      return search;
    }

    const dbSearch = await res.json();
    return {
      id: dbSearch[0]?.id || search.id,
      ...params,
      createdAt: dbSearch[0]?.created_at || search.createdAt
    };
  } catch (err) {
    logger.warn('Search persistence error, using in-memory', {
      route: 'search/persistence',
      error: String(err)
    });
    inMemoryStore.unshift(search);
    return search;
  }
}

export async function getSearchHistory(organizationId: string): Promise<SavedSearch[]> {
  try {
    const res = await supabaseFetch(
      `/rest/v1/saved_searches?organization_id=eq.${organizationId}&order=created_at.desc&limit=50`
    );

    if (!res.ok) {
      return inMemoryStore.filter(s => s.organizationId === organizationId).slice(0, 50);
    }

    const data = await res.json();
    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      verticalSlug: row.vertical_slug,
      filters: row.filters,
      resultCount: row.result_count,
      createdAt: row.created_at
    }));
  } catch {
    return inMemoryStore.filter(s => s.organizationId === organizationId).slice(0, 50);
  }
}
