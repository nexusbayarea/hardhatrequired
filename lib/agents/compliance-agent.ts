import type { AgentContext, AgentResult, PageAction } from '@/types/copilot';
import { eventBus } from '@/lib/event-bus';

export class ComplianceAgent {
  async execute(ctx: AgentContext): Promise<AgentResult> {
    eventBus.emit('COMPLIANCE_CHECKED', { params: ctx.params }, 'compliance-agent');

    const actions: PageAction[] = [
      { type: 'showNotification', message: 'Checking compliance requirements...', severity: 'info' },
    ];

    const { vertical, zip, message } = ctx.params;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zip: zip || '94538',
          radius: 50,
          vertical: vertical || 'slurry_processing',
          mode: 'compliance',
          message: message || ctx.message,
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
        message: `Found ${data.count ?? 0} compliance results`,
      };
    } catch (err: any) {
      eventBus.emit('ERROR', { error: err.message }, 'compliance-agent');
      return { success: false, actions, message: err.message };
    }
  }
}

export const complianceAgent = new ComplianceAgent();
