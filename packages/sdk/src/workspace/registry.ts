import type { ComponentType } from 'react';

export interface WorkspaceComponentEntry {
  id: string;
  component: ComponentType<any>;
  wrapper?: ComponentType<{ children: React.ReactNode }>;
  searchProvider?: string;
  offline?: boolean;
}

const workspaceComponents = new Map<string, WorkspaceComponentEntry>();

export function registerWorkspaceComponent(entry: WorkspaceComponentEntry): void {
  workspaceComponents.set(entry.id, entry);
}

export function getWorkspaceComponent(id: string): WorkspaceComponentEntry | undefined {
  return workspaceComponents.get(id);
}

export function getWorkspaceComponentIds(): string[] {
  return Array.from(workspaceComponents.keys());
}

export function isOfflineCapable(workspaceId: string): boolean {
  return workspaceComponents.get(workspaceId)?.offline ?? false;
}
