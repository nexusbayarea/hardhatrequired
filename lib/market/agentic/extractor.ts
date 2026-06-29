import { getSecret } from '@/lib/infisical';

export class GeminiExtractor {
  name = 'gemini_extractor';

  async extractFromState(dom: string, screenshotPath: string | null, schema: any): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY || await getSecret('GEMINI_API_KEY');
    if (!apiKey) return {};

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Extract structured data from this page content matching the schema: ${JSON.stringify(schema)}.\n\nPage content:\n${dom}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1,
            },
          }),
        }
      );

      if (!response.ok) return {};
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }
}
