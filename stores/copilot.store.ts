import type { PageAction, CopilotIntent } from '@/types/copilot';
import { createStore, useStore } from './index';

export interface CopilotMessage {
  id: string;
  text: string;
  isUser: boolean;
  actions?: PageAction[];
  intent?: CopilotIntent;
  done?: boolean;
}

interface CopilotState {
  messages: CopilotMessage[];
  isExecuting: boolean;
  open: boolean;
}

let msgCounter = 0;

export const copilotStore = createStore<CopilotState>({
  messages: [],
  isExecuting: false,
  open: false,
});

export function useCopilotStore() {
  const state = useStore(copilotStore, s => s);
  return {
    ...state,
    setOpen: (open: boolean) => copilotStore.setState({ open }),
    addUserMessage: (text: string) => {
      const { messages } = copilotStore.getState();
      copilotStore.setState({
        messages: [...messages, { id: `msg-${++msgCounter}`, text, isUser: true }],
        isExecuting: true,
      });
    },
    addResponse: (text: string, actions?: PageAction[], intent?: CopilotIntent) => {
      const { messages } = copilotStore.getState();
      copilotStore.setState({
        messages: [...messages, { id: `msg-${++msgCounter}`, text, isUser: false, actions, intent, done: true }],
        isExecuting: false,
      });
    },
    markActionsDone: (messageId: string) => {
      const { messages } = copilotStore.getState();
      copilotStore.setState({
        messages: messages.map(m =>
          m.id === messageId ? { ...m, done: true, actions: m.actions?.map(a => ({ ...a, done: true as any })) } : m
        ),
      });
    },
    addError: (error: string) => {
      const { messages } = copilotStore.getState();
      copilotStore.setState({
        messages: [...messages, { id: `msg-${++msgCounter}`, text: error, isUser: false, done: true }],
        isExecuting: false,
      });
    },
    clear: () => copilotStore.setState({ messages: [], isExecuting: false }),
  };
}
