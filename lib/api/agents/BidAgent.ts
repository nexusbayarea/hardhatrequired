import { bidStore } from '@/stores/bid.store';
import { resultsStore } from '@/stores/results.store';
import { eventBus } from '@/lib/api/orchestrator/eventBus';

export interface BidParams {
  zip?: string;
  vertical?: string;
  message?: string;
}

export class BidAgent {
  async execute(params: BidParams): Promise<void> {
    bidStore.setState({ generating: true });
    eventBus.emit('bid:started', params);

    try {
      const res = await fetch('/api/bid-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: params.zip || '94538',
          vertical: params.vertical || 'slurry_processing',
          message: params.message || '',
        }),
      });

      const data = await res.json();

      if (data.success) {
        if (Array.isArray(data.companies)) {
          resultsStore.setState({ items: data.companies, count: data.count, loading: false, error: null });
        }
        if (data.breakdown) bidStore.setState({ breakdown: data.breakdown });
        if (data.totalEstimate) bidStore.setState({ totalEstimate: data.totalEstimate });
        eventBus.emit('bid:completed', data);
      } else {
        eventBus.emit('bid:error', data.error);
      }
    } catch (err: any) {
      eventBus.emit('bid:error', err.message);
    } finally {
      bidStore.setState({ generating: false });
    }
  }
}

export const bidAgent = new BidAgent();
