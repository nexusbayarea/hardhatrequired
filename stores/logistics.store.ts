import { createStore, useStore } from './index';

interface RouteEstimate {
  vendorId: string;
  vendorName: string;
  distanceMiles: number;
  transitTimeMins: number;
  cycleTimeMins: number;
  haulingCost: number;
  disposalCost: number;
  totalCost: number;
  costPerGallon: number;
}

interface LogisticsState {
  targetGallons: number;
  estimates: RouteEstimate[];
  selectedVendorId: string | null;
  loading: boolean;
}

export const logisticsStore = createStore<LogisticsState>({
  targetGallons: 3000,
  estimates: [],
  selectedVendorId: null,
  loading: false,
});

export function useLogisticsStore() {
  const state = useStore(logisticsStore, s => s);
  return {
    ...state,
    setTargetGallons: (g: number) => logisticsStore.setState({ targetGallons: g }),
    setEstimates: (estimates: RouteEstimate[]) => logisticsStore.setState({ estimates, loading: false }),
    selectVendor: (id: string | null) => logisticsStore.setState({ selectedVendorId: id }),
    setLoading: (loading: boolean) => logisticsStore.setState({ loading }),
  };
}
