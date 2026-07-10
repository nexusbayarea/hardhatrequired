import type { PageAction, ForemanIntent } from '@/types/foreman';
import { createStore, useStore } from './index';

export interface ForemanMessage {
  id: string;
  text: string;
  isUser: boolean;
  actions?: PageAction[];
  intent?: ForemanIntent;
  done?: boolean;
}

interface ForemanState {
  messages: ForemanMessage[];
  isExecuting: boolean;
  open: boolean;
}

let msgCounter = 0;

export const foremanStore = createStore<ForemanState>({
  messages: [],
  isExecuting: false,
  open: false,
});

export function useForemanStore() {
  const state = useStore(foremanStore, s => s);
  return {
    ...state,
    setOpen: (open: boolean) => foremanStore.setState({ open }),
    addUserMessage: (text: string) => {
      const { messages } = foremanStore.getState();
      foremanStore.setState({
        messages: [...messages, { id: `msg-${++msgCounter}`, text, isUser: true }],
        isExecuting: true,
      });
    },
    addResponse: (text: string, actions?: PageAction[], intent?: ForemanIntent) => {
      const { messages } = foremanStore.getState();
      foremanStore.setState({
        messages: [...messages, { id: `msg-${++msgCounter}`, text, isUser: false, actions, intent, done: true }],
        isExecuting: false,
      });
    },
    markActionsDone: (messageId: string) => {
      const { messages } = foremanStore.getState();
      foremanStore.setState({
        messages: messages.map(m =>
          m.id === messageId ? { ...m, done: true, actions: m.actions?.map(a => ({ ...a, done: true as any })) } : m
        ),
      });
    },
    addError: (error: string) => {
      const { messages } = foremanStore.getState();
      foremanStore.setState({
        messages: [...messages, { id: `msg-${++msgCounter}`, text: error, isUser: false, done: true }],
        isExecuting: false,
      });
    },
    clear: () => foremanStore.setState({ messages: [], isExecuting: false }),
  };
}
