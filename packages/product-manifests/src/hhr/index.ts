import type { ProductManifest } from '../index';

export const HHR_MODULES = [
  { id: 'disposal', name: 'Find Disposal', description: 'Permitted disposal facilities and tipping sites', enabled: true },
  { id: 'labor', name: 'Labor', description: 'Crews, operators, and contractors', enabled: true },
  { id: 'equipment', name: 'Equipment', description: 'Vacuum trucks, heavy equipment, tools', enabled: true },
  { id: 'bids', name: 'Bids', description: 'Open RFPs and bid intelligence', enabled: true },
  { id: 'intelligence', name: 'Intelligence', description: 'Daily intelligence feed and market trends', enabled: true },
  { id: 'projects', name: 'Projects', description: 'Project workspace management', enabled: true },
  { id: 'saved', name: 'Saved', description: 'Saved searches and vendors', enabled: true },
];

export const hhrManifest: ProductManifest = {
  id: 'hhr',
  name: 'Hard Hat Required',
  description: 'AI-powered market intelligence for construction',
  version: '0.1.0',
  icon: 'HardHat',
  modules: HHR_MODULES.map(m => ({ ...m, component: undefined })),
  workspaces: [
    { id: 'command', label: 'Command Center', icon: 'LayoutDashboard', description: 'Overview and quick actions' },
    { id: 'search', label: 'Search', icon: 'Search', description: 'Find operators, facilities, equipment' },
    { id: 'logistics', label: 'Logistics', icon: 'Truck', description: 'Route analysis and cost modeling' },
    { id: 'equipment', label: 'Equipment', icon: 'Wrench', description: 'Rental comparison and booking' },
    { id: 'bids', label: 'Bids', icon: 'Briefcase', description: 'Bid intelligence and proposals' },
    { id: 'markets', label: 'Markets', icon: 'TrendingUp', description: 'Market intelligence feed' },
    { id: 'saved', label: 'Saved', icon: 'Bookmark', description: 'Saved items' },
  ],
  defaultWorkspace: 'search',
  routes: [
    { path: '/dashboard', moduleId: 'intelligence', label: 'Dashboard', showInNav: true },
    { path: '/dashboard/search', moduleId: 'disposal', label: 'Search', showInNav: true },
    { path: '/dashboard/billing', moduleId: 'bids', label: 'Billing', showInNav: false },
    { path: '/dashboard/settings', moduleId: 'saved', label: 'Settings', showInNav: false },
  ],
};
