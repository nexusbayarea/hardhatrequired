import { useSyncExternalStore, useRef } from 'react';

export type Listener = () => void;

export interface Store<T> {
  getState: () => T;
  setState: (partial: Partial<T>) => void;
  subscribe: (listener: Listener) => () => void;
  reset: () => void;
}

export function createStore<T extends Record<string, any>>(initial: T): Store<T> {
  let state = { ...initial };
  const listeners = new Set<Listener>();

  return {
    getState: () => state,
    setState: (partial: Partial<T>) => {
      state = { ...state, ...partial };
      listeners.forEach(l => l());
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset: () => {
      state = { ...initial };
      listeners.forEach(l => l());
    },
  };
}

export function useStore<T, S>(store: Store<T>, selector: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()), () => selector(store.getState()));
}
