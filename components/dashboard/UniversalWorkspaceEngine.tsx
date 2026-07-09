'use client';

import React from 'react';
import { WorkspaceRenderer } from '@iie/sdk/workspace';

export interface UniversalWorkspaceEngineProps {
  workspaceId: string;
  productId?: string;
  searchProps?: Record<string, any>;
}

export function UniversalWorkspaceEngine({
  workspaceId,
  searchProps,
}: UniversalWorkspaceEngineProps) {
  return (
    <WorkspaceRenderer
      workspaceId={workspaceId}
      fallback={<div className="p-8 text-center text-slate-500">Select a workspace</div>}
      {...searchProps}
    />
  );
}
