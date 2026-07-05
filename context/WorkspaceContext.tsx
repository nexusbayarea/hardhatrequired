'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { workspaceStore, type WorkspaceId } from '@/stores/workspace.store';

export type { WorkspaceId };

interface WorkspaceContextValue {
  workspace: WorkspaceId;
  setWorkspace: (id: WorkspaceId) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const state = workspaceStore.getState();

  useEffect(() => {
    const unsub = workspaceStore.subscribe(() => {});
    return unsub;
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace: state.active,
        setWorkspace: (id: WorkspaceId) => workspaceStore.setState({ active: id }),
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
