import type { AgentContext, AgentResult, PageAction } from '@/types/foreman';
import { eventBus } from '@/lib/event-bus';

export class LogisticsAgent {
  async execute(ctx: AgentContext): Promise<AgentResult> {
    eventBus.emit('LOGISTICS_ESTIMATED', { params: ctx.params }, 'logistics-agent');

    const actions: PageAction[] = [
      { type: 'setWorkspace', value: 'logistics' },
    ];

    const { gallons, zip, vertical } = ctx.params;

    if (gallons) actions.push({ type: 'setGallons', value: gallons });
    if (zip) actions.push({ type: 'setZip', value: zip });
    if (vertical) actions.push({ type: 'setVertical', value: vertical });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: zip || '94538',
          radius: 25,
          vertical: vertical || 'slurry_processing',
          mode: 'disposal',
          ...(gallons ? { gallons } : {}),
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.companies)) {
        actions.push({ type: 'searchResults', results: data.companies, count: data.count });
      }

      return {
        success: true,
        actions,
        data,
        message: gallons
          ? `Estimated logistics for ${gallons.toLocaleString()} gallons`
          : 'Logistics workspace ready',
      };
    } catch (err: any) {
      eventBus.emit('ERROR', { error: err.message }, 'logistics-agent');
      return { success: false, actions, message: err.message };
    }
  }
}

export const logisticsAgent = new LogisticsAgent();
