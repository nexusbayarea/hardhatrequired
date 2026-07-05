import { createStore, useStore } from './index';

interface CostBreakdown {
  labor: { item: string; hours: number; rate: number; total: number }[];
  disposal: { item: string; volume: number; rate: number; total: number }[];
  equipment: { item: string; days: number; rate: number; total: number }[];
  materials: { item: string; quantity: number; unit: string; total: number }[];
}

interface BidState {
  scope: string;
  breakdown: CostBreakdown | null;
  totalEstimate: number;
  markup: number;
  profitMargin: number;
  generating: boolean;
}

export const bidStore = createStore<BidState>({
  scope: '',
  breakdown: null,
  totalEstimate: 0,
  markup: 15,
  profitMargin: 20,
  generating: false,
});

export function useBidStore() {
  const state = useStore(bidStore, s => s);
  return {
    ...state,
    setScope: (s: string) => bidStore.setState({ scope: s }),
    setBreakdown: (b: CostBreakdown) => bidStore.setState({ breakdown: b, generating: false }),
    setTotalEstimate: (t: number) => bidStore.setState({ totalEstimate: t }),
    setMarkup: (m: number) => bidStore.setState({ markup: m }),
    setProfitMargin: (p: number) => bidStore.setState({ profitMargin: p }),
    setGenerating: (g: boolean) => bidStore.setState({ generating: g }),
    reset: () => bidStore.reset(),
  };
}
