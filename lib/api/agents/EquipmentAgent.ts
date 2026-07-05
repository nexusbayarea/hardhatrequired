import { equipmentStore } from '@/stores/equipment.store';
import { eventBus } from '@/lib/api/orchestrator/eventBus';

export interface EquipmentParams {
  zip?: string;
  radius?: number;
  vertical?: string;
}

export class EquipmentAgent {
  async execute(params: EquipmentParams): Promise<void> {
    equipmentStore.setState({ loading: true });
    eventBus.emit('equipment:started', params);

    try {
      const res = await fetch('/api/equipment-rental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: params.zip || '94538',
          radius: params.radius || 50,
          vertical: params.vertical || 'slurry_processing',
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.companies)) {
        const items = data.companies.map((c: any) => ({
          id: c.id,
          name: c.companyName,
          type: c.type || 'unknown',
          capacity: c.capacity || '',
          rate: c.leadScore || 0,
          vendor: c.companyName,
          distance: c.distanceMiles || 0,
          available: true,
        }));
        equipmentStore.setState({ items, loading: false });
        eventBus.emit('equipment:completed', { count: items.length });
      } else {
        equipmentStore.setState({ loading: false });
        eventBus.emit('equipment:error', data.error);
      }
    } catch (err: any) {
      equipmentStore.setState({ loading: false });
      eventBus.emit('equipment:error', err.message);
    }
  }
}

export const equipmentAgent = new EquipmentAgent();
