import { resultsStore } from '@/stores/results.store';
import type { SearchResult } from '@/types/search';
import { eventBus } from '@/lib/api/orchestrator/eventBus';

export interface SearchParams {
  zip?: string;
  radius?: number;
  vertical?: string;
  mode?: string;
  gallons?: number;
}

export class SearchAgent {
  async execute(params: SearchParams): Promise<void> {
    resultsStore.setState({ loading: true, error: null });
    eventBus.emit('search:started', params);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: params.zip || '94538',
          radius: params.radius || 25,
          vertical: params.vertical || 'slurry_processing',
          mode: params.mode || 'labor',
          ...(params.gallons ? { gallons: params.gallons } : {}),
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.companies)) {
        resultsStore.setState({ items: data.companies, count: data.count, loading: false, error: null });
        eventBus.emit('search:completed', { count: data.count, results: data.companies });
      } else {
        resultsStore.setState({ error: data.error || 'Search failed', loading: false });
        eventBus.emit('search:error', data.error);
      }
    } catch (err: any) {
      resultsStore.setState({ error: err.message, loading: false });
      eventBus.emit('search:error', err.message);
    }
  }
}

export const searchAgent = new SearchAgent();
