'use client';

import { useEffect, useRef } from 'react';

export function AgentCopilotProvider() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || typeof window === 'undefined') return;
    initialized.current = true;

    window.triggerAgentInputChange = (element: HTMLElement, targetValue: string) => {
      if (!element) return;

      const tagName = element.tagName.toLowerCase();
      let prototype: any = null;
      let eventName = 'input';

      if (tagName === 'input') {
        prototype = window.HTMLInputElement.prototype;
        const type = (element as HTMLInputElement).type;
        if (type === 'checkbox' || type === 'radio') eventName = 'change';
      } else if (tagName === 'select') {
        prototype = window.HTMLSelectElement.prototype;
        eventName = 'change';
      } else if (tagName === 'textarea') {
        prototype = window.HTMLTextAreaElement.prototype;
      }

      if (prototype) {
        const nativeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (nativeValueSetter) {
          nativeValueSetter.call(element, targetValue);
          const syntheticEvent = new Event(eventName, { bubbles: true, cancelable: true });
          element.dispatchEvent(syntheticEvent);
        }
      }
    };

    import('page-agent').then(({ PageAgent }) => {
      const agent = new PageAgent({
        model: process.env.NEXT_PUBLIC_COPILOT_MODEL || 'gpt-4o-mini',
        baseURL: process.env.NEXT_PUBLIC_LLM_GATEWAY_URL,
        apiKey: process.env.NEXT_PUBLIC_LLM_GATEWAY_KEY,
        language: 'en-US',
        includeAttributes: ['data-agent-*', 'data-unit'],
        customInstructions: `
          You are the Slurry Logistics UI Agent operating a React application layout.
          CRITICAL INTERACTION RULE:
          Whenever you need to mutate an input field, select dropdown, or text area, do not assign the value property directly.
          Instead, you MUST invoke the global window helper like this:
          window.triggerAgentInputChange(elementTarget, "newValue");
          This ensures the controlled React hooks trigger downstream pricing calculations instantly.
        `,
      });

      (window as any).uiCopilot = agent;
    });
  }, []);

  return null;
}

declare global {
  interface Window {
    triggerAgentInputChange: (element: HTMLElement, targetValue: string) => void;
    uiCopilot: any;
  }
}
