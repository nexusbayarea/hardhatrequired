import { supabaseFetch } from '@/lib/db';

export class SupabaseVectorStore {
  async searchHistoricalEvents(query: string, location: any): Promise<any[]> {
    try {
      const res = await supabaseFetch('/rest/v1/rpc/search_events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query_text: query,
          location: typeof location === 'string' ? location : `${location.lat},${location.lng}`,
          radius: typeof location === 'object' ? location.radius : 25,
        }),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  async query(sql: string, params?: any[]): Promise<any[]> {
    try {
      const res = await supabaseFetch('/rest/v1/rpc/vector_query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql, params }),
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }
}
