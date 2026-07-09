'use client';

import React from 'react';
import { getWorkspaceComponent } from './registry';

export interface WorkspaceRendererProps {
  workspaceId: string;
  fallback?: React.ReactNode;
  [key: string]: any;
}

export function WorkspaceRenderer({
  workspaceId,
  fallback,
  ...props
}: WorkspaceRendererProps) {
  try {
    const entry = getWorkspaceComponent(workspaceId);
    if (!entry) {
      return <>{fallback ?? <div>Unknown workspace: {workspaceId}</div>}</>;
    }

    const Component = entry.component;
    const Wrapper = entry.wrapper;

    if (Wrapper) {
      return (
        <Wrapper>
          <Component {...props} />
        </Wrapper>
      );
    }

    return <Component {...props} />;
  } catch (err) {
    console.error(`[WorkspaceRenderer] Failed to render workspace "${workspaceId}":`, err);
    return <>{fallback ?? <div>Error rendering workspace: {workspaceId}</div>}</>;
  }
}
