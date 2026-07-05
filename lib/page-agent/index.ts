import type { PageAction, CopilotIntent } from '@/types/copilot';
import { eventBus } from '@/lib/api/orchestrator/eventBus';
import { frontendOrchestrator } from '@/lib/api/orchestrator/FrontendOrchestrator';

export class PageAgent {
  private static instance: PageAgent;
  private actionHandler: ((action: PageAction) => Promise<void>) | null = null;

  static getInstance(): PageAgent {
    if (!PageAgent.instance) {
      PageAgent.instance = new PageAgent();
    }
    return PageAgent.instance;
  }

  setActionHandler(handler: (action: PageAction) => Promise<void>): void {
    this.actionHandler = handler;
  }

  async execute(actions: PageAction[]): Promise<void> {
    const uiActions: PageAction[] = [];

    for (const action of actions) {
      switch (action.type) {
        case 'setWorkspace':
        case 'setMode':
        case 'setVertical':
        case 'setZip':
        case 'setRadius':
        case 'setGallons':
          uiActions.push(action);
          break;
        case 'click':
        case 'fillForm':
        case 'navigate':
        case 'openDrawer':
        case 'closeDrawer':
        case 'scroll':
        case 'highlight':
        case 'expandCard':
        case 'compareVendors':
        case 'showNotification':
        case 'searchResults':
          uiActions.push(action);
          break;
      }
    }

    if (uiActions.length > 0) {
      await frontendOrchestrator.executePageActions(uiActions);
    }

    this.executeDOMActions(actions);
  }

  async executeIntent(intent: CopilotIntent, params: Record<string, any>): Promise<void> {
    await frontendOrchestrator.handle({ intent, params });
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
        }
      } catch (err) {
        console.error(`[PageAgent] DOM action failed: ${action.type}`, err);
        eventBus.emit('pageagent:error', { action: action.type, error: String(err) });
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
