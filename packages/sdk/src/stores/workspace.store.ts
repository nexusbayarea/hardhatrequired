import { createStore, type Store } from './index';
import type { WorkspaceId } from '../types';

export interface WorkspaceState {
  active: WorkspaceId;
  previous: WorkspaceId | null;
}

export function createWorkspaceStore(
  initial: WorkspaceId = 'search'
): Store<WorkspaceState> {
  return createStore<WorkspaceState>({ active: initial, previous: null });
}
