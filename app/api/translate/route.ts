import { NextRequest, NextResponse } from 'next/server';
import { getCachedTranslation, setCachedTranslation } from '@/lib/translation/cache';

export async function POST(req: NextRequest) {
  try {
    const { text, target = 'es' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Missing text payload' }, { status: 400 });
    }

    const isBatch = Array.isArray(text);
    const textArray: string[] = isBatch ? text : [text];

    const results: string[] = [];
    const cacheMisses: { text: string; index: number }[] = [];

    for (let i = 0; i < textArray.length; i++) {
      const cached = await getCachedTranslation(textArray[i], target);
      if (cached) {
        results[i] = cached;
      } else {
        cacheMisses.push({ text: textArray[i], index: i });
      }
    }

    if (cacheMisses.length > 0) {
      const queryStrings = cacheMisses.map(m => m.text);

      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            q: queryStrings,
            target,
            format: 'text',
          }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Google Translate API Error: ${errText}`);
      }

      const data = await response.json();
      const translations = data.data.translations;

      for (let i = 0; i < cacheMisses.length; i++) {
        const translatedText = translations[i].translatedText;
        const originalIndex = cacheMisses[i].index;

        results[originalIndex] = translatedText;

        await setCachedTranslation(cacheMisses[i].text, target, translatedText);
      }
    }

    return NextResponse.json({
      success: true,
      translatedText: isBatch ? results : results[0],
      source: cacheMisses.length === 0 ? 'cache' : 'hybrid',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
