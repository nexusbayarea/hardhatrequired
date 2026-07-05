import type { SearchResult } from '@/types/search';
import { createStore, useStore } from './index';

interface ResultsState {
  items: SearchResult[];
  count: number;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  comparedIds: string[];
}

export const resultsStore = createStore<ResultsState>({
  items: [],
  count: 0,
  loading: false,
  error: null,
  selectedId: null,
  comparedIds: [],
});

export function useResultsStore() {
  const state = useStore(resultsStore, s => s);
  return {
    ...state,
    setResults: (items: SearchResult[], count: number) =>
      resultsStore.setState({ items, count, loading: false, error: null }),
    setLoading: (loading: boolean) => resultsStore.setState({ loading }),
    setError: (error: string) => resultsStore.setState({ error, loading: false }),
    select: (id: string) => resultsStore.setState({ selectedId: id }),
    toggleCompare: (id: string) => {
      const { comparedIds } = resultsStore.getState();
      const next = comparedIds.includes(id)
        ? comparedIds.filter(x => x !== id)
        : [...comparedIds, id];
      resultsStore.setState({ comparedIds: next });
    },
    clearCompared: () => resultsStore.setState({ comparedIds: [] }),
    reset: () => resultsStore.reset(),
  };
}
