import { createStore } from './index';

export interface WorkspaceState {
  active: string;
  previous: string | null;
}

const saved = typeof window !== 'undefined' ? localStorage.getItem('hhr-workspace') : null;
const initialActive = saved || 'search';

export const workspaceStore = createStore<WorkspaceState>({ active: initialActive, previous: null });
