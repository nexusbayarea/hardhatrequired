'use client';

import { registerWorkspaceComponent, registerSearchProvider } from '@iie/sdk';
import CommandCenter from '@/components/dashboard/workspace/CommandCenter';
import SearchIntelligence from '@/components/dashboard/workspace/SearchIntelligence';
import LogisticsIntelligence from '@/components/dashboard/workspace/LogisticsIntelligence';
import EquipmentExchange from '@/components/dashboard/workspace/EquipmentExchange';
import BidIntelligence from '@/components/dashboard/workspace/BidIntelligence';
import MarketIntelligence from '@/components/dashboard/workspace/MarketIntelligence';
import SavedItems from '@/components/dashboard/workspace/SavedItems';
import SettingsWorkspace from '@/components/dashboard/workspace/SettingsWorkspace';

export function registerHHRWorkspaces(): void {
  registerWorkspaceComponent({ id: 'command', component: CommandCenter });
  registerWorkspaceComponent({ id: 'search', component: SearchIntelligence });
  registerWorkspaceComponent({ id: 'logistics', component: LogisticsIntelligence });
  registerWorkspaceComponent({ id: 'equipment', component: EquipmentExchange });
  registerWorkspaceComponent({ id: 'bids', component: BidIntelligence });
  registerWorkspaceComponent({ id: 'markets', component: MarketIntelligence });
  registerWorkspaceComponent({ id: 'saved', component: SavedItems });
  registerWorkspaceComponent({ id: 'settings', component: SettingsWorkspace });
}
