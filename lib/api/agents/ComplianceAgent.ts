import { resultsStore } from '@/stores/results.store';
import { eventBus } from '@/lib/api/orchestrator/eventBus';

export interface ComplianceParams {
  zip?: string;
  vertical?: string;
  message?: string;
}

export class ComplianceAgent {
  async execute(params: ComplianceParams): Promise<void> {
    resultsStore.setState({ loading: true, error: null });
    eventBus.emit('compliance:started', params);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: params.zip || '94538',
          radius: 50,
          vertical: params.vertical || 'slurry_processing',
          mode: 'compliance',
          message: params.message || '',
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.companies)) {
        resultsStore.setState({ items: data.companies, count: data.count, loading: false, error: null });
        eventBus.emit('compliance:completed', { count: data.count });
      } else {
        resultsStore.setState({ error: data.error || 'Compliance check failed', loading: false });
        eventBus.emit('compliance:error', data.error);
      }
    } catch (err: any) {
      resultsStore.setState({ error: err.message, loading: false });
      eventBus.emit('compliance:error', err.message);
    }
  }
}

export const complianceAgent = new ComplianceAgent();
