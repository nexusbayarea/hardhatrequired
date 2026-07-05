import { logisticsStore } from '@/stores/logistics.store';
import { resultsStore } from '@/stores/results.store';
import { eventBus } from '@/lib/api/orchestrator/eventBus';

export interface LogisticsParams {
  zip?: string;
  radius?: number;
  vertical?: string;
  gallons?: number;
}

export class LogisticsAgent {
  async execute(params: LogisticsParams): Promise<void> {
    logisticsStore.setState({ loading: true });
    eventBus.emit('logistics:started', params);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: params.zip || '94538',
          radius: params.radius || 25,
          vertical: params.vertical || 'slurry_processing',
          mode: 'disposal',
          ...(params.gallons ? { gallons: params.gallons } : {}),
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.companies)) {
        const estimates = data.companies.map((c: any) => ({
          vendorId: c.id,
          vendorName: c.companyName,
          distanceMiles: c.distanceMiles || 0,
          transitTimeMins: c.logisticsEstimates?.oneWayTransitTimeMins || 0,
          cycleTimeMins: c.logisticsEstimates?.totalRoundTripMins || 0,
          haulingCost: c.logisticsEstimates?.haulingCost || 0,
          disposalCost: c.logisticsEstimates?.disposalCost || 0,
          totalCost: c.logisticsEstimates?.totalCost || 0,
          costPerGallon: c.logisticsEstimates?.costPerGallon || 0,
        }));

        logisticsStore.setState({ estimates, loading: false });
        resultsStore.setState({ items: data.companies, count: data.count, loading: false, error: null });
        eventBus.emit('logistics:completed', { estimates: estimates.length });
      } else {
        logisticsStore.setState({ loading: false });
        eventBus.emit('logistics:error', data.error);
      }
    } catch (err: any) {
      logisticsStore.setState({ loading: false });
      eventBus.emit('logistics:error', err.message);
    }
  }
}

export const logisticsAgent = new LogisticsAgent();
