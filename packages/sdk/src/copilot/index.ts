import type { CopilotRequest, CopilotResponse, ExtractedIntent } from '../types';

export async function sendMessage(request: CopilotRequest): Promise<CopilotResponse> {
  const res = await fetch('/api/copilot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error(`Copilot request failed: ${res.status}`);
  return res.json();
}

export function extractIntent(message: string): ExtractedIntent {
  const lower = message.toLowerCase();

  if (/\b(find|search|locate|where)\b.*\b(disposal|dump|landfill|tip)\b/.test(lower)) {
    return { intent: 'search', confidence: 0.9, params: { mode: 'disposal' } };
  }
  if (/\b(find|search|locate|need)\b.*\b(labor|crew|operator|worker|guy|man)\b/.test(lower)) {
    return { intent: 'search', confidence: 0.85, params: { mode: 'labor' } };
  }
  if (/\b(route|logistics|cost|haul|transport)\b/.test(lower)) {
    return { intent: 'logistics', confidence: 0.8, params: {} };
  }
  if (/\b(rent|lease|equipment|vacuum truck|excavator)\b/.test(lower)) {
    return { intent: 'equipment', confidence: 0.85, params: {} };
  }
  if (/\b(bid|proposal|rfp|contract)\b/.test(lower)) {
    return { intent: 'bid', confidence: 0.8, params: {} };
  }
  if (/\b(compliance|permit|regulatory|osha|swppp)\b/.test(lower)) {
    return { intent: 'compliance', confidence: 0.8, params: {} };
  }
  if (/\b(go|navigate|open|show)\b/.test(lower)) {
    return { intent: 'navigate', confidence: 0.6, params: {} };
  }
  if (/\b(translate|language|spanish|chinese|vietnamese)\b/.test(lower)) {
    return { intent: 'translate', confidence: 0.7, params: {} };
  }

  return { intent: 'unknown', confidence: 0.3, params: {} };
}
