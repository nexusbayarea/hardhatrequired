import type { PageAction, CopilotIntent } from '../types';

export interface PageAgentConfig {
  onStoreAction: (actions: PageAction[]) => Promise<void>;
  onEvent?: (name: string, payload?: Record<string, unknown>) => void;
}

export class PageAgent {
  private static instance: PageAgent;
  private config: PageAgentConfig | null = null;

  static getInstance(): PageAgent {
    if (!PageAgent.instance) {
      PageAgent.instance = new PageAgent();
    }
    return PageAgent.instance;
  }

  configure(config: PageAgentConfig): void {
    this.config = config;
  }

  async execute(actions: PageAction[]): Promise<void> {
    if (!this.config) {
      console.warn('[PageAgent] not configured');
      return;
    }

    const storeActions = actions.filter(a =>
      ['setWorkspace', 'setMode', 'setVertical', 'setZip', 'setRadius', 'setGallons', 'searchResults'].includes(a.type)
    );

    if (storeActions.length > 0) {
      await this.config.onStoreAction(storeActions);
    }

    this.executeDOMActions(actions);
  }

  async executeIntent(intent: CopilotIntent, params: Record<string, any>): Promise<void> {
    this.config?.onEvent?.('intent:execute', { intent, params });
  }

  private executeDOMActions(actions: PageAction[]): void {
    if (typeof document === 'undefined') return;

    for (const action of actions) {
      try {
        switch (action.type) {
          case 'click': {
            const el = this.findElement(action.target);
            if (el) (el as HTMLElement).click();
            break;
          }
          case 'fillForm': {
            const el = this.findElement(action.selector);
            if (el) {
              this.setNativeValue(el, action.value);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }
            break;
          }
          case 'scroll': {
            if (action.direction === 'to' && action.target) {
              this.findElement(action.target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              window.scrollBy({ top: action.direction === 'down' ? 400 : -400, behavior: 'smooth' });
            }
            break;
          }
          case 'highlight': {
            const el = this.findElement(action.selector);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              (el as HTMLElement).style.outline = '3px solid var(--color-red)';
              (el as HTMLElement).style.outlineOffset = '2px';
              setTimeout(() => {
                (el as HTMLElement).style.outline = '';
                (el as HTMLElement).style.outlineOffset = '';
              }, 3000);
            }
            break;
          }
          case 'expandCard': {
            const el = this.findElement(action.selector);
            const toggle = el?.querySelector('[data-agent-intent="expand-card"]') as HTMLElement;
            toggle?.click();
            break;
          }
          case 'showNotification': {
            break;
          }
          case 'navigate': {
            if (typeof window !== 'undefined') {
              window.location.href = action.route;
            }
            break;
          }
        }
      } catch (err) {
        console.error('[PageAgent] DOM action failed:', action.type, err);
        this.config?.onEvent?.('pageagent:error', { action: action.type, error: String(err) });
      }
    }
  }

  private findElement(target: string): Element | null {
    if (target.startsWith('#')) return document.getElementById(target.slice(1));
    if (target.startsWith('[') || target.startsWith('.')) return document.querySelector(target);
    return document.querySelector(`[data-agent-intent="${target}"]`) || document.getElementById(target);
  }

  private setNativeValue(element: Element, value: string): void {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      (element as HTMLInputElement).constructor.prototype, 'value'
    )?.set;
    if (nativeSetter) {
      nativeSetter.call(element, value);
    } else {
      (element as HTMLInputElement).value = value;
    }
  }
}

export const pageAgent = PageAgent.getInstance();
