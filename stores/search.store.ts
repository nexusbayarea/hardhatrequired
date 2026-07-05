import { createStore, useStore } from './index';

export type SearchPane = 'labor' | 'disposal' | 'equipment' | 'bids';

interface SearchState {
  vertical: string;
  zip: string;
  radius: number;
  gallons: number;
  activePane: SearchPane;
}

export const searchStore = createStore<SearchState>({
  vertical: '',
  zip: '',
  radius: 25,
  gallons: 0,
  activePane: 'labor',
});

export function useSearchStore() {
  const state = useStore(searchStore, s => s);
  return {
    ...state,
    setVertical: (v: string) => searchStore.setState({ vertical: v }),
    setZip: (z: string) => searchStore.setState({ zip: z }),
    setRadius: (r: number) => searchStore.setState({ radius: r }),
    setGallons: (g: number) => searchStore.setState({ gallons: g }),
    setActivePane: (p: SearchPane) => searchStore.setState({ activePane: p }),
    reset: () => searchStore.reset(),
  };
}
