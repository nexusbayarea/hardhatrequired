import { NextRequest, NextResponse } from 'next/server';

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export async function POST(req: NextRequest) {
  try {
    const { model, messages, temperature, max_tokens, response_format } = await req.json();

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'NVIDIA_API_KEY not configured' }, { status: 500 });
    }

    const body: Record<string, any> = {
      model: model || 'meta/llama-3.1-8b-instruct',
      messages,
      temperature: temperature ?? 0.2,
      max_tokens: max_tokens ?? 2048,
    };

    if (response_format) {
      body.response_format = response_format;
    }

    const res = await fetch(NVIDIA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `NVIDIA API error ${res.status}: ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[AI Chat] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
