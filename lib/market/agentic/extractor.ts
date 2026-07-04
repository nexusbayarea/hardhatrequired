export class GeminiExtractor {
  name = 'gemini_extractor';

  async extractFromState(dom: string, screenshotPath: string | null, schema: any): Promise<any> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [
            {
              role: 'system',
              content: `Extract structured data from the page content matching this schema. Return ONLY valid JSON matching the schema, no markdown wrappers. Schema: ${JSON.stringify(schema)}`,
            },
            {
              role: 'user',
              content: `Page content:\n${dom}`,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) return {};
      const result = await response.json();
      const text = result.choices?.[0]?.message?.content;
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }
}
