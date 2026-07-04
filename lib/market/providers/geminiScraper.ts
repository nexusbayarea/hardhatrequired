const API_URL = () => {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/api/ai/chat/completions`;
};

async function nvidiaChat(messages: { role: string; content: string }[], opts?: { response_format?: any; temperature?: number; max_tokens?: number }) {
  try {
    const res = await fetch(API_URL(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages,
        response_format: opts?.response_format,
        temperature: opts?.temperature ?? 0.1,
        max_tokens: opts?.max_tokens ?? 2048,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

export class GeminiScraperAdapter {
  name = 'deepseek_scraper';

  async scanForSignals(
    websiteUrl: string | undefined,
    equipmentKeywords: string[]
  ): Promise<{ hasSignals: boolean; capabilitySummary: string }> {
    if (!websiteUrl) {
      return { hasSignals: false, capabilitySummary: '' };
    }

    try {
      const pageText = await this.fetchPageText(websiteUrl);
      if (!pageText || pageText.length < 50) {
        return { hasSignals: false, capabilitySummary: '' };
      }

      const rawContent = await nvidiaChat([
        {
          role: 'system',
          content: 'You are a business intelligence analyst. Analyze company website content for specific industrial capabilities. Respond in JSON only.'
        },
        {
          role: 'user',
          content: `Analyze this company website content: ${websiteUrl}

Website content:
${pageText.slice(0, 3000)}

We need to determine if this company offers:
- slurry recycling
- concrete washout
- concrete reclaiming
- ready mix reclaiming
- ${equipmentKeywords.join(', ')}

Also identify any relevant equipment they operate.

Respond with JSON:
{
  "relevant": boolean,
  "confidence": number (0-100),
  "detectedSignals": string[],
  "summaryNotes": string (2-3 sentence description of their capabilities and relevance)
}`
        }
      ], { response_format: { type: 'json_object' } });

      if (!rawContent) return { hasSignals: false, capabilitySummary: '' };

      const parsed = JSON.parse(rawContent);
      return {
        hasSignals: parsed.relevant || (parsed.detectedSignals?.length > 0),
        capabilitySummary: parsed.summaryNotes || parsed.detectedSignals?.join(', ') || '',
      };
    } catch (err) {
      console.error('NVIDIA scraping failed:', err);
      return { hasSignals: false, capabilitySummary: '' };
    }
  }

  private async fetchPageText(url: string): Promise<string> {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(3000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IndexIntelligenceEngine/1.0)' }
      });
      if (!res.ok) return '';
      const html = await res.text();

      const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
      const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || '';
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&[^;]+;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return [title, desc, text.slice(0, 5000)].filter(Boolean).join('\n');
    } catch {
      return '';
    }
  }

  async synthesizeItinerary(events: any[], accommodations: any[], requirements: string[]): Promise<any> {
    try {
      const rawContent = await nvidiaChat([
        { role: 'system', content: 'You are an itinerary planner. Synthesize events and accommodations into a cohesive travel plan. Respond in JSON only.' },
        { role: 'user', content: `Events: ${JSON.stringify(events)}\nAccommodations: ${JSON.stringify(accommodations)}\nRequirements: ${requirements.join(', ')}\n\nReturn JSON: { itinerary: { day: string, event: string, accommodation: string, notes: string }[] }` },
      ], { response_format: { type: 'json_object' } });

      return rawContent ? JSON.parse(rawContent) : { events, accommodations };
    } catch {
      return { events, accommodations };
    }
  }

  async autonomousScrape(url: string, extractionPrompt: string): Promise<any> {
    try {
      const pageText = await this.fetchPageText(url);
      if (!pageText || pageText.length < 50) return null;

      const rawContent = await nvidiaChat([
        { role: 'system', content: 'You extract structured data from web content. Return JSON only.' },
        { role: 'user', content: `URL: ${url}\n\nPage content:\n${pageText.slice(0, 4000)}\n\nMission: ${extractionPrompt}` },
      ], { response_format: { type: 'json_object' } });

      return rawContent ? JSON.parse(rawContent) : null;
    } catch {
      return null;
    }
  }
}
