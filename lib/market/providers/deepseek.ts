import { getSecret } from '@/lib/infisical';

export class DeepSeekAdapter {
  name = 'deepseek_scraper';

  async scanForSignals(
    websiteUrl: string | undefined,
    equipmentKeywords: string[]
  ): Promise<{ hasSignals: boolean; capabilitySummary: string }> {
    const apiKey = await getSecret('DEEPSEEK_API_KEY');
    if (!apiKey || !websiteUrl) {
      return { hasSignals: false, capabilitySummary: '' };
    }

    try {
      const body = {
        model: 'deepseek-chat',
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
        hasSignals: parsed.hasCapability || (parsed.foundEquipmentSignals?.length > 0),
        capabilitySummary: parsed.summaryNotes || parsed.foundEquipmentSignals?.join(', ') || '',
      };
    } catch (err) {
      console.error('DeepSeek scraping failed:', err);
      return { hasSignals: false, capabilitySummary: '' };
    }
  }
}
