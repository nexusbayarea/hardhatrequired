'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { SearchPane } from '@/components/dashboard/SearchConsole';
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

function emptyPane(): SearchPaneData {
  return { data: null, loading: false, error: null, vertical: '' };
}

const SearchStateContext = createContext<SearchStateContextValue | null>(null);

export function SearchStateProvider({ children }: { children: ReactNode }) {
  const [searchState, setSearchState] = useState<SearchPaneData>(emptyPane);
  const [activePane, setActivePane] = useState<SearchPane>('labor');

  const resetSearch = () => setSearchState(emptyPane());

  return (
    <SearchStateContext.Provider value={{ searchState, setSearchState, activePane, setActivePane, resetSearch }}>
      {children}
    </SearchStateContext.Provider>
  );
}

export function useSearchState() {
  const ctx = useContext(SearchStateContext);
  if (!ctx) throw new Error('useSearchState must be used within SearchStateProvider');
  return ctx;
}
