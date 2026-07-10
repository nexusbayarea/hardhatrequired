import type { PageAction, ForemanIntent } from '@/types/foreman';
import { searchAgent } from '@/lib/api/agents/SearchAgent';
import { equipmentAgent } from '@/lib/api/agents/EquipmentAgent';
import { logisticsAgent } from '@/lib/api/agents/LogisticsAgent';
import { bidAgent } from '@/lib/api/agents/BidAgent';
import { complianceAgent } from '@/lib/api/agents/ComplianceAgent';
import { workspaceStore } from '@/stores/workspace.store';
import { searchStore } from '@/stores/search.store';
import { eventBus } from './eventBus';

interface OrchestratorAction {
  intent: ForemanIntent;
  params: Record<string, any>;
}

export class FrontendOrchestrator {
  async handle(action: OrchestratorAction): Promise<void> {
    eventBus.emit('orchestrator:route', action);

    switch (action.intent) {
      case 'search':
        await searchAgent.execute(action.params);
        break;
      case 'logistics':
        workspaceStore.setState({ active: 'logistics' });
        await logisticsAgent.execute(action.params);
        break;
      case 'equipment':
        workspaceStore.setState({ active: 'equipment' });
        await equipmentAgent.execute(action.params);
        break;
      case 'bid':
        workspaceStore.setState({ active: 'bids' });
        await bidAgent.execute(action.params);
        break;
      case 'compliance':
        await complianceAgent.execute(action.params);
        break;
      case 'navigate':
        workspaceStore.setState({ active: action.params.workspace as any || 'search' });
        break;
      default:
        if (action.params.vertical || action.params.zip || action.params.mode) {
          if (action.params.vertical) searchStore.setState({ vertical: action.params.vertical });
          if (action.params.zip) searchStore.setState({ zip: action.params.zip });
          if (action.params.radius) searchStore.setState({ radius: action.params.radius });
          if (action.params.mode) searchStore.setState({ activePane: action.params.mode });
          await searchAgent.execute(action.params);
        }
        break;
    }
  }

  async executePageActions(actions: PageAction[]): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'setWorkspace':
          workspaceStore.setState({ active: action.value });
          break;
        case 'setMode':
          searchStore.setState({ activePane: action.value });
          break;
        case 'setVertical':
          searchStore.setState({ vertical: action.value });
          break;
        case 'setZip':
          searchStore.setState({ zip: action.value });
          break;
        case 'setRadius':
          searchStore.setState({ radius: action.value });
          break;
        case 'setGallons':
          searchStore.setState({ gallons: action.value });
          break;
        case 'searchResults':
          break;
      }
    }
  }
}

export const frontendOrchestrator = new FrontendOrchestrator();
