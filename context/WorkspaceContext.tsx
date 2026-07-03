'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

interface WorkspaceContextValue {
  workspace: WorkspaceId;
  setWorkspace: (id: WorkspaceId) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children, defaultWorkspace = 'command-center' }: { children: ReactNode; defaultWorkspace?: WorkspaceId }) {
  const [workspace, setWorkspaceState] = useState<WorkspaceId>(defaultWorkspace);

  const setWorkspace = useCallback((id: WorkspaceId) => {
    setWorkspaceState(id);
  }, []);

  return (
    <WorkspaceContext.Provider value={{ workspace, setWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
