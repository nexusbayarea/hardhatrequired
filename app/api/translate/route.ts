import { NextRequest, NextResponse } from 'next/server';

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

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

    const isArray = Array.isArray(text);
    const payloadText = isArray ? JSON.stringify(text) : text;

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'NVIDIA_API_KEY not configured' }, { status: 500 });
    }

    const systemPrompt = `You are an expert industrial construction translator.
Translate the provided text or JSON array of texts into the target language code: "${target}".
- Preserve all numbers, measurements, currency values, codes, and technical jargon (e.g., "vacuum truck", "slurry", "CSLB", "tons").
- Keep formatting, line breaks, and HTML tags completely intact.
- Return ONLY the translation. If input was a JSON array, return a valid JSON array of translated strings with matching indices. Do not write any markdown codeblock wraps or introductory explanations.`;

    const res = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: payloadText },
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { success: false, error: `NVIDIA API error ${res.status}: ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const translatedContent = data.choices?.[0]?.message?.content;

    if (!translatedContent) {
      return NextResponse.json(
        { success: false, error: 'Empty translation output received from NVIDIA API.' },
        { status: 502 }
      );
    }

    let result: any = translatedContent.trim();
    if (isArray) {
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

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Fatal translation engine execution exception.' },
      { status: 500 }
    );
  }
}
