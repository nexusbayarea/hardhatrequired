'use client';

import { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';
import { searchStore, type SearchPane } from '@/stores/search.store';
import { resultsStore } from '@/stores/results.store';
import type { SearchResult } from '@/types/search';

export interface SearchPaneData {
  data: { companies: SearchResult[]; count: number } | null;
  loading: boolean;
  error: string | null;
  vertical: string;
}

interface SearchStateContextValue {
  searchState: SearchPaneData;
  setSearchState: (updater: SearchPaneData | ((prev: SearchPaneData) => SearchPaneData)) => void;
  activePane: SearchPane;
  setActivePane: (pane: SearchPane) => void;
  resetSearch: () => void;
}

const SearchStateContext = createContext<SearchStateContextValue | null>(null);

function toSearchPaneData(): SearchPaneData {
  const r = resultsStore.getState();
  const s = searchStore.getState();
  return {
    data: r.items.length > 0 ? { companies: r.items, count: r.count } : null,
    loading: r.loading,
    error: r.error,
    vertical: s.vertical,
  };
}

export function SearchStateProvider({ children }: { children: ReactNode }) {
  const searchState = useSyncExternalStore(
    (cb) => {
      const unsub1 = resultsStore.subscribe(cb);
      const unsub2 = searchStore.subscribe(cb);
      return () => { unsub1(); unsub2(); };
    },
    toSearchPaneData,
    toSearchPaneData
  );

  return (
    <SearchStateContext.Provider
      value={{
        searchState,
        activePane: searchStore.getState().activePane,
        setSearchState: (updater) => {
          if (typeof updater === 'function') {
            const prev = toSearchPaneData();
            const next = updater(prev);
            resultsStore.setState({ items: next.data?.companies ?? [], count: next.data?.count ?? 0, loading: next.loading, error: next.error });
            if (next.vertical !== undefined) searchStore.setState({ vertical: next.vertical });
          } else {
            resultsStore.setState({ items: updater.data?.companies ?? [], count: updater.data?.count ?? 0, loading: updater.loading, error: updater.error });
            if (updater.vertical !== undefined) searchStore.setState({ vertical: updater.vertical });
          }
        },
        setActivePane: (pane) => searchStore.setState({ activePane: pane }),
        resetSearch: () => { resultsStore.reset(); },
      }}
    >
      {children}
    </SearchStateContext.Provider>
  );
}

export function useSearchState() {
  const ctx = useContext(SearchStateContext);
  if (!ctx) throw new Error('useSearchState must be used within SearchStateProvider');
  return ctx;
}
