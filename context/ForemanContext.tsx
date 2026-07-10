'use client';

import { createContext, useContext, useCallback, useRef, useEffect, ReactNode } from 'react';
import type { PageAction, ForemanEvent, ForemanEventName } from '@/types/foreman';
import { pageAgent } from '@/lib/page-agent';
import { foremanStore, useForemanStore } from '@/stores/foreman.store';
import { eventBus } from '@/lib/event-bus';
import { frontendOrchestrator } from '@/lib/api/orchestrator/FrontendOrchestrator';

interface ForemanContextValue {
  messages: ReturnType<typeof useForemanStore>['messages'];
  isExecuting: boolean;
  open: boolean;
  send: (message: string) => Promise<void>;
  clear: () => void;
  setOpen: (v: boolean) => void;
  onEvent: (handler: (event: ForemanEvent) => void) => () => void;
}

const ForemanContext = createContext<ForemanContextValue | null>(null);

export function ForemanProvider({ children }: { children: ReactNode }) {
  const { messages, isExecuting, open } = useForemanStore();
  const actionHandlerRef = useRef<(action: PageAction) => Promise<void>>(undefined);

  useEffect(() => {
    const handler = async (action: PageAction) => {
      await frontendOrchestrator.executePageActions([action]);
    };
    actionHandlerRef.current = handler;
    pageAgent.setActionHandler(handler);
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || isExecuting) return;

    foremanStore.getState().messages; // touch
    foremanStore.setState({ isExecuting: true });
    foremanStore.setState({
      messages: [...foremanStore.getState().messages, { id: `msg-${Date.now()}`, text, isUser: true }],
    });

    try {
      const res = await fetch('/api/foreman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const actions: PageAction[] = data.actions ?? [];
      const msgId = `msg-${Date.now()}`;

      foremanStore.setState({
        messages: [...foremanStore.getState().messages, {
          id: msgId, text: data.message || '', isUser: false, actions, intent: data.intent, done: true,
        }],
        isExecuting: false,
      });

      if (actions.length > 0) {
        await pageAgent.execute(actions);
      }
    } catch (err: any) {
      foremanStore.setState({
        messages: [...foremanStore.getState().messages, {
          id: `msg-${Date.now()}`, text: `Error: ${err.message}`, isUser: false, done: true,
        }],
        isExecuting: false,
      });
    }
  }, [isExecuting]);

  const clear = useCallback(() => foremanStore.setState({ messages: [], isExecuting: false }), []);
  const setOpen = useCallback((v: boolean) => foremanStore.setState({ open: v }), []);

  const onEvent = useCallback((handler: (event: ForemanEvent) => void) => {
    const names: ForemanEventName[] = ['SEARCH_STARTED', 'SEARCH_FINISHED', 'VENDOR_OPENED', 'VENDOR_SAVED',
      'EQUIPMENT_COMPARED', 'BID_CREATED', 'PROJECT_CREATED', 'INTENT_ROUTED', 'AGENT_ACTION', 'ERROR'];
    const unsubs = names.map(e => eventBus.on(e, handler));
    return () => unsubs.forEach(u => u());
  }, []);

  return (
    <ForemanContext.Provider value={{ messages, isExecuting, open, send, clear, setOpen, onEvent }}>
      {children}
    </ForemanContext.Provider>
  );
}

export function useForeman() {
  const ctx = useContext(ForemanContext);
  if (!ctx) throw new Error('useForeman must be used within ForemanProvider');
  return ctx;
}
