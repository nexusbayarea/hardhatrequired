export class GeminiScraperAdapter {
  name = 'deepseek_scraper';

  async scanForSignals(
    websiteUrl: string | undefined,
    equipmentKeywords: string[]
  ): Promise<{ hasSignals: boolean; capabilitySummary: string }> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey || !websiteUrl) {
      return { hasSignals: false, capabilitySummary: '' };
    }

    try {
      const pageText = await this.fetchPageText(websiteUrl);
      if (!pageText || pageText.length < 50) {
        return { hasSignals: false, capabilitySummary: '' };
      }

      const body = {
        model: 'deepseek-chat',
        messages: [
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
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      };

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return { hasSignals: false, capabilitySummary: '' };
      }

      const result = await response.json();
      const rawContent = result.choices?.[0]?.message?.content;

      if (!rawContent) {
        return { hasSignals: false, capabilitySummary: '' };
      }

      const parsed = JSON.parse(rawContent);
      return {
        hasSignals: parsed.relevant || (parsed.detectedSignals?.length > 0),
        capabilitySummary: parsed.summaryNotes || parsed.detectedSignals?.join(', ') || '',
      };
    } catch (err) {
      console.error('DeepSeek scraping failed:', err);
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
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return { events, accommodations };

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an itinerary planner. Synthesize events and accommodations into a cohesive travel plan. Respond in JSON only.' },
            { role: 'user', content: `Events: ${JSON.stringify(events)}\nAccommodations: ${JSON.stringify(accommodations)}\nRequirements: ${requirements.join(', ')}\n\nReturn JSON: { itinerary: { day: string, event: string, accommodation: string, notes: string }[] }` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (!response.ok) return { events, accommodations };
      const result = await response.json();
      const rawContent = result.choices?.[0]?.message?.content;
      return rawContent ? JSON.parse(rawContent) : { events, accommodations };
    } catch {
      return { events, accommodations };
    }
  }

  async autonomousScrape(url: string, extractionPrompt: string): Promise<any> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return null;

    try {
      const pageText = await this.fetchPageText(url);
      if (!pageText || pageText.length < 50) return null;

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You extract structured data from web content. Return JSON only.' },
            { role: 'user', content: `URL: ${url}\n\nPage content:\n${pageText.slice(0, 4000)}\n\nMission: ${extractionPrompt}` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (!response.ok) return null;
      const result = await response.json();
      const rawContent = result.choices?.[0]?.message?.content;
      return rawContent ? JSON.parse(rawContent) : null;
    } catch {
      return null;
    }
  }
}
