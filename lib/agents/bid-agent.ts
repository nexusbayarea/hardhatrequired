import type { AgentContext, AgentResult, PageAction } from '@/types/copilot';
import { eventBus } from '@/lib/event-bus';

export class BidAgent {
  async execute(ctx: AgentContext): Promise<AgentResult> {
    eventBus.emit('BID_CREATED', { params: ctx.params }, 'bid-agent');

    const actions: PageAction[] = [
      { type: 'setWorkspace', value: 'bids' },
    ];

    const { vertical, zip } = ctx.params;
    if (vertical) actions.push({ type: 'setVertical', value: vertical });
    if (zip) actions.push({ type: 'setZip', value: zip });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/bid-intelligence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: zip || '94538',
          vertical: vertical || 'slurry_processing',
          message: ctx.message,
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
        message: 'Bid analysis ready',
      };
    } catch (err: any) {
      eventBus.emit('ERROR', { error: err.message }, 'bid-agent');
      return { success: false, actions, message: err.message };
    }
  }
}

export const bidAgent = new BidAgent();
