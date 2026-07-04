export class DeepSeekAdapter {
  name = 'deepseek_scraper';

  async scanForSignals(
    websiteUrl: string | undefined,
    equipmentKeywords: string[]
  ): Promise<{ hasSignals: boolean; capabilitySummary: string }> {
    if (!websiteUrl) {
      return { hasSignals: false, capabilitySummary: '' };
    }

    try {
      const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const res = await fetch(`${base}/api/ai/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [
            {
              role: 'system',
              content: 'You are a business intelligence analyst. Analyze company websites for specific industrial capabilities. Respond in JSON only.'
            },
            {
              role: 'user',
              content: `Analyze this company website: ${websiteUrl}
We need to identify whether this facility manages industrial operations related to: ${equipmentKeywords.join(', ')}.
Respond with JSON: { "hasCapability": boolean, "foundEquipmentSignals": string[], "summaryNotes": string }`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      });

      if (!res.ok) return { hasSignals: false, capabilitySummary: '' };

      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) return { hasSignals: false, capabilitySummary: '' };

      const parsed = JSON.parse(rawContent);
      return {
        hasSignals: parsed.hasCapability || (parsed.foundEquipmentSignals?.length > 0),
        capabilitySummary: parsed.summaryNotes || parsed.foundEquipmentSignals?.join(', ') || '',
      };
    } catch (err) {
      console.error('NVIDIA scraping failed:', err);
      return { hasSignals: false, capabilitySummary: '' };
    }
  }
}
