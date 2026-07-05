import { createStore, useStore } from './index';

export type WorkspaceId =
  | 'command-center'
  | 'search'
  | 'logistics'
  | 'equipment'
  | 'bids'
  | 'market'
  | 'saved-searches'
  | 'saved-vendors'
  | 'projects'
  | 'settings';

interface WorkspaceState {
  active: WorkspaceId;
}

export const workspaceStore = createStore<WorkspaceState>({
  active: 'command-center',
});

export function useWorkspace() {
  const active = useStore(workspaceStore, s => s.active);
  return {
    active,
    setWorkspace: (id: WorkspaceId) => workspaceStore.setState({ active: id }),
  };
}
