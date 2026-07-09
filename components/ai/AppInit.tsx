'use client';

import { useEffect } from 'react';
import { pageAgent } from '@/lib/page-agent';
import { frontendOrchestrator } from '@/lib/api/orchestrator/FrontendOrchestrator';
import { hhrManifest, registerProduct } from '@iie/product-manifests';
import { registerHHRWorkspaces } from '@/lib/workspace-registry';

export function AppInit() {
  useEffect(() => {
    registerProduct(hhrManifest);
    registerHHRWorkspaces();

    pageAgent.setActionHandler(async (action) => {
      await frontendOrchestrator.executePageActions([action]);
    });

    return () => {};
  }, []);

  return null;
}
