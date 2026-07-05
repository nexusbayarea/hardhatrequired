import { createStore, useStore } from './index';

interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  capacity: string;
  rate: number;
  vendor: string;
  distance: number;
  available: boolean;
}

interface EquipmentState {
  items: EquipmentItem[];
  bookedIds: string[];
  loading: boolean;
  filters: {
    type: string;
    minCapacity: string;
    maxRate: number;
  };
}

export const equipmentStore = createStore<EquipmentState>({
  items: [],
  bookedIds: [],
  loading: false,
  filters: { type: '', minCapacity: '', maxRate: 0 },
});

export function useEquipmentStore() {
  const state = useStore(equipmentStore, s => s);
  return {
    ...state,
    setItems: (items: EquipmentItem[]) => equipmentStore.setState({ items, loading: false }),
    setLoading: (loading: boolean) => equipmentStore.setState({ loading }),
    book: (id: string) => {
      const { bookedIds } = equipmentStore.getState();
      if (!bookedIds.includes(id)) {
        equipmentStore.setState({ bookedIds: [...bookedIds, id] });
      }
    },
    release: (id: string) => {
      const { bookedIds } = equipmentStore.getState();
      equipmentStore.setState({ bookedIds: bookedIds.filter(x => x !== id) });
    },
    setFilter: (key: keyof EquipmentState['filters'], value: any) => {
      const { filters } = equipmentStore.getState();
      equipmentStore.setState({ filters: { ...filters, [key]: value } });
    },
  };
}
