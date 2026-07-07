import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const MAX_RETRIES = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    const { text, target } = await req.json();

    if (!text || !target) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters: "text" and "target" are required.' },
        { status: 400 }
      );
    }

    if (target === 'en') {
      return NextResponse.json({ success: true, translatedText: text });
    }

    const payloadText = Array.isArray(text) ? JSON.stringify(text) : text;

    const systemPrompt = `You are an expert industrial construction translator.
Translate the provided text or JSON array of texts into the target language code: "${target}".
- Preserve all numbers, measurements, currency values, codes, and technical jargon (e.g., "vacuum truck", "slurry", "CSLB", "tons").
- Keep formatting, line breaks, and HTML tags completely intact.
- Return ONLY the translation. If input was a JSON array, return a valid JSON array of translated strings with matching indices. Do not write any markdown codeblock wraps or introductory explanations.`;

    const apiKey = process.env.GEMINI_API_KEY || '';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    let lastError: any;
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: payloadText }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
          })
        });

        if (!response.ok) {
          throw new Error(`Gemini translation gateway returned HTTP ${response.status}`);
        }

        const data = await response.json();
        const translatedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!translatedContent) {
          throw new Error('Empty translation output received from gateway.');
        }

        let result: any = translatedContent.trim();
        if (Array.isArray(text)) {
          try {
            if (result.startsWith('```json')) {
              result = result.substring(7, result.length - 3);
            } else if (result.startsWith('```')) {
              result = result.substring(3, result.length - 3);
            }
            result = JSON.parse(result.trim());
          } catch (e) {
            console.warn('Failed to parse translated array, falling back to raw output splits', e);
            result = [result];
          }
        }

        return NextResponse.json({ success: true, translatedText: result });

      } catch (err) {
        lastError = err;
        attempt++;
        if (attempt < MAX_RETRIES) {
          const delay = Math.pow(2, attempt) * 1000;
          await sleep(delay);
        }
      }
    }

    throw lastError;

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Fatal translation engine execution exception.' },
      { status: 500 }
    );
  }
}
