'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { workspaceStore, type WorkspaceId } from '@/stores/workspace.store';

export type { WorkspaceId };

interface WorkspaceContextValue {
  workspace: WorkspaceId;
  setWorkspace: (id: WorkspaceId) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(() => workspaceStore.getState().active);

  useEffect(() => {
    const unsub = workspaceStore.subscribe(() => {
      setActive(workspaceStore.getState().active);
    });
    return unsub;
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace: active,
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
