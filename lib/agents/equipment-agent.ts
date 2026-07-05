import type { AgentContext, AgentResult, PageAction } from '@/types/copilot';
import { eventBus } from '@/lib/event-bus';

export class EquipmentAgent {
  async execute(ctx: AgentContext): Promise<AgentResult> {
    eventBus.emit('EQUIPMENT_COMPARED', { params: ctx.params }, 'equipment-agent');

    const actions: PageAction[] = [
      { type: 'setWorkspace', value: 'equipment' },
    ];

    const { vertical, zip } = ctx.params;
    if (vertical) actions.push({ type: 'setVertical', value: vertical });
    if (zip) actions.push({ type: 'setZip', value: zip });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/equipment-rental`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: zip || '94538',
          radius: 50,
          vertical: vertical || 'slurry_processing',
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
        message: `Found ${data.count ?? 0} equipment options`,
      };
    } catch (err: any) {
      eventBus.emit('ERROR', { error: err.message }, 'equipment-agent');
      return { success: false, actions, message: err.message };
    }
  }
}

export const equipmentAgent = new EquipmentAgent();
