import type { AgentContext, AgentResult, PageAction } from '@/types/copilot';
import { eventBus } from '@/lib/event-bus';

export class SearchAgent {
  async execute(ctx: AgentContext): Promise<AgentResult> {
    eventBus.emit('SEARCH_STARTED', { params: ctx.params }, 'search-agent');

    const { vertical, zip, radius, mode, gallons } = ctx.params;

    const actions: PageAction[] = [];

    if (mode) actions.push({ type: 'setMode', value: mode });
    if (vertical) actions.push({ type: 'setVertical', value: vertical });
    if (zip) actions.push({ type: 'setZip', value: zip });
    if (radius) actions.push({ type: 'setRadius', value: radius });
    if (gallons && mode === 'disposal') actions.push({ type: 'setGallons', value: gallons });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: zip || '94538',
          radius: radius || 25,
          vertical: vertical || 'slurry_processing',
          mode: mode || 'labor',
          ...(gallons ? { gallons } : {}),
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.companies)) {
        actions.push({ type: 'searchResults', results: data.companies, count: data.count });
      }

      eventBus.emit('SEARCH_FINISHED', { count: data.count ?? 0 }, 'search-agent');

      return {
        success: true,
        actions,
        data,
        message: `Found ${data.count ?? 0} results`,
      };
    } catch (err: any) {
      eventBus.emit('ERROR', { error: err.message }, 'search-agent');
      return {
        success: false,
        actions,
        message: err.message,
      };
    }
  }
}

export const searchAgent = new SearchAgent();
