import type { SearchResult } from '@/types/search';
import { createStore, useStore } from './index';

interface SavedVendor {
  id: string;
  companyName: string;
  savedAt: number;
  notes?: string;
}

interface VendorsState {
  saved: SavedVendor[];
  highlightedId: string | null;
  openedId: string | null;
}

export const vendorsStore = createStore<VendorsState>({
  saved: [],
  highlightedId: null,
  openedId: null,
});

export function useVendorsStore() {
  const state = useStore(vendorsStore, s => s);
  return {
    ...state,
    save: (vendor: SearchResult) => {
      const { saved } = vendorsStore.getState();
      if (saved.some(v => v.id === vendor.id)) return;
      vendorsStore.setState({
        saved: [...saved, { id: vendor.id, companyName: vendor.companyName, savedAt: Date.now() }],
      });
    },
    unsave: (id: string) => {
      const { saved } = vendorsStore.getState();
      vendorsStore.setState({ saved: saved.filter(v => v.id !== id) });
    },
    highlight: (id: string | null) => vendorsStore.setState({ highlightedId: id }),
    open: (id: string | null) => vendorsStore.setState({ openedId: id }),
    addNote: (id: string, note: string) => {
      const { saved } = vendorsStore.getState();
      vendorsStore.setState({
        saved: saved.map(v => v.id === id ? { ...v, notes: note } : v),
      });
    },
  };
}
