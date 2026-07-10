import type { ForemanEventName, ForemanEvent, ForemanEventHandler } from '../types';

type HandlerEntry = {
  handler: ForemanEventHandler;
  once: boolean;
};

export class EventBus {
  private static instance: EventBus;
  private handlers = new Map<ForemanEventName, HandlerEntry[]>();

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: ForemanEventName, handler: ForemanEventHandler): () => void {
    return this.addHandler(event, handler, false);
  }

  once(event: ForemanEventName, handler: ForemanEventHandler): () => void {
    return this.addHandler(event, handler, true);
  }

  private addHandler(event: ForemanEventName, handler: ForemanEventHandler, once: boolean): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push({ handler, once });
    return () => this.remove(event, handler);
  }

  remove(event: ForemanEventName, handler: ForemanEventHandler): void {
    const entries = this.handlers.get(event);
    if (!entries) return;
    const idx = entries.findIndex(e => e.handler === handler);
    if (idx !== -1) entries.splice(idx, 1);
  }

  emit(eventName: ForemanEventName, payload?: Record<string, unknown>, source?: string): void {
    const entries = this.handlers.get(eventName);
    if (!entries) return;

    const event: ForemanEvent = {
      name: eventName,
      timestamp: Date.now(),
      payload,
      source,
    };

    const toRemove: ForemanEventHandler[] = [];
    for (const entry of entries) {
      entry.handler(event);
      if (entry.once) toRemove.push(entry.handler);
    }

    for (const handler of toRemove) {
      this.remove(eventName, handler);
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = EventBus.getInstance();
