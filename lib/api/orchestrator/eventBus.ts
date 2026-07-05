type EventHandler = (payload?: any) => void;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, payload?: any): void {
    this.handlers.get(event)?.forEach(h => h(payload));
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
