'use client';

import { createContext, useContext, useCallback, useRef, useEffect, ReactNode } from 'react';
import type { PageAction, CopilotEvent, CopilotEventName } from '@/types/copilot';
import { pageAgent } from '@/lib/page-agent';
import { copilotStore, useCopilotStore } from '@/stores/copilot.store';
import { eventBus } from '@/lib/event-bus';
import { frontendOrchestrator } from '@/lib/api/orchestrator/FrontendOrchestrator';

interface CopilotContextValue {
  messages: ReturnType<typeof useCopilotStore>['messages'];
  isExecuting: boolean;
  open: boolean;
  send: (message: string) => Promise<void>;
  clear: () => void;
  setOpen: (v: boolean) => void;
  onEvent: (handler: (event: CopilotEvent) => void) => () => void;
}

const CopilotContext = createContext<CopilotContextValue | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const { messages, isExecuting, open } = useCopilotStore();
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

    copilotStore.getState().messages; // touch
    copilotStore.setState({ isExecuting: true });
    copilotStore.setState({
      messages: [...copilotStore.getState().messages, { id: `msg-${Date.now()}`, text, isUser: true }],
    });

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const actions: PageAction[] = data.actions ?? [];
      const msgId = `msg-${Date.now()}`;

      copilotStore.setState({
        messages: [...copilotStore.getState().messages, {
          id: msgId, text: data.message || '', isUser: false, actions, intent: data.intent, done: true,
        }],
        isExecuting: false,
      });

      if (actions.length > 0) {
        await pageAgent.execute(actions);
      }
    } catch (err: any) {
      copilotStore.setState({
        messages: [...copilotStore.getState().messages, {
          id: `msg-${Date.now()}`, text: `Error: ${err.message}`, isUser: false, done: true,
        }],
        isExecuting: false,
      });
    }
  }, [isExecuting]);

  const clear = useCallback(() => copilotStore.setState({ messages: [], isExecuting: false }), []);
  const setOpen = useCallback((v: boolean) => copilotStore.setState({ open: v }), []);

  const onEvent = useCallback((handler: (event: CopilotEvent) => void) => {
    const names: CopilotEventName[] = ['SEARCH_STARTED', 'SEARCH_FINISHED', 'VENDOR_OPENED', 'VENDOR_SAVED',
      'EQUIPMENT_COMPARED', 'BID_CREATED', 'PROJECT_CREATED', 'INTENT_ROUTED', 'AGENT_ACTION', 'ERROR'];
    const unsubs = names.map(e => eventBus.on(e, handler));
    return () => unsubs.forEach(u => u());
  }, []);

  return (
    <CopilotContext.Provider value={{ messages, isExecuting, open, send, clear, setOpen, onEvent }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error('useCopilot must be used within CopilotProvider');
  return ctx;
}
