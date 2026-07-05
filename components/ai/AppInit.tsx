'use client';

import { useEffect } from 'react';
import { pageAgent } from '@/lib/page-agent';
import { frontendOrchestrator } from '@/lib/api/orchestrator/FrontendOrchestrator';
import { eventBus } from '@/lib/api/orchestrator/eventBus';
import { resultsStore } from '@/stores/results.store';
import { searchStore } from '@/stores/search.store';

export function AppInit() {
  useEffect(() => {
    pageAgent.setActionHandler(async (action) => {
      await frontendOrchestrator.executePageActions([action]);
    });

    return () => {};
  }, []);

  return null;
}
