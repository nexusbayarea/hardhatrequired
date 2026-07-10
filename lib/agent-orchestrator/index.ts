import type { AgentContext, AgentResult, ForemanIntent, ExtractedIntent, PageAction } from '@/types/foreman';
import { agentRegistry } from '@/lib/agents';
import { eventBus } from '@/lib/event-bus';

export class AgentOrchestrator {
  async orchestrate(intent: ExtractedIntent, message: string): Promise<AgentResult> {
    const ctx: AgentContext = {
      message,
      intent: intent.intent,
      params: intent.params,
    };

    const intentName = intent.intent.toUpperCase();
    eventBus.emit('INTENT_ROUTED', { intent: intent.intent, confidence: intent.confidence }, 'agent-orchestrator');

    if (!agentRegistry.has(intent.intent)) {
      const fallbackActions: PageAction[] = [];
      if (intent.params.mode || intent.params.vertical || intent.params.zip) {
        fallbackActions.push({ type: 'setMode' as const, value: intent.params.mode || 'labor' });
        if (intent.params.vertical) fallbackActions.push({ type: 'setVertical' as const, value: intent.params.vertical });
        if (intent.params.zip) fallbackActions.push({ type: 'setZip' as const, value: intent.params.zip });
        if (intent.params.radius) fallbackActions.push({ type: 'setRadius' as const, value: intent.params.radius });
      }

      return {
        success: true,
        actions: fallbackActions,
        message: `I understood you're looking for ${intent.params.vertical || 'something'}. I've set up the search parameters.`,
      };
    }

    const agent = agentRegistry.get(intent.intent)!;
    return agent.execute(ctx);
  }
}

export const agentOrchestrator = new AgentOrchestrator();
