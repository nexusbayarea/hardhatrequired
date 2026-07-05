import type { AgentContext, AgentResult, CopilotIntent } from '@/types/copilot';
import { searchAgent } from './search-agent';
import { logisticsAgent } from './logistics-agent';
import { equipmentAgent } from './equipment-agent';
import { bidAgent } from './bid-agent';
import { complianceAgent } from './compliance-agent';

interface Agent {
  execute(ctx: AgentContext): Promise<AgentResult>;
}

class AgentRegistry {
  private agents = new Map<CopilotIntent, Agent>();

  constructor() {
    this.agents.set('search', searchAgent);
    this.agents.set('logistics', logisticsAgent);
    this.agents.set('equipment', equipmentAgent);
    this.agents.set('bid', bidAgent);
    this.agents.set('compliance', complianceAgent);
  }

  get(intent: CopilotIntent): Agent | undefined {
    return this.agents.get(intent);
  }

  has(intent: CopilotIntent): boolean {
    return this.agents.has(intent);
  }
}

export const agentRegistry = new AgentRegistry();
export { searchAgent } from './search-agent';
export { logisticsAgent } from './logistics-agent';
export { equipmentAgent } from './equipment-agent';
export { bidAgent } from './bid-agent';
export { complianceAgent } from './compliance-agent';
