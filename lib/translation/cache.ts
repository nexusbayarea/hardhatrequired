import crypto from 'crypto';
import { redis, redisAvailable } from '@/lib/redis';

function generateKey(text: string, lang: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(text.trim().toLowerCase())
    .digest('hex');
  return `translation:${lang}:${hash}`;
}

export async function getCachedTranslation(text: string, lang: string): Promise<string | null> {
  if (!redisAvailable()) return null;
  const key = generateKey(text, lang);
  return redis!.get<string>(key);
}

export async function setCachedTranslation(
  text: string,
  lang: string,
  translation: string,
): Promise<void> {
  if (!redisAvailable()) return;
  const key = generateKey(text, lang);
  await redis!.set(key, translation, { ex: 60 * 60 * 24 * 30 });
}

export async function preCachePhrases(
  phrases: string[],
  targetLangs: string[],
  translateFn: (text: string, target: string) => Promise<string>,
): Promise<void> {
  if (!redisAvailable()) return;
  for (const phrase of phrases) {
    for (const lang of targetLangs) {
      const cached = await getCachedTranslation(phrase, lang);
      if (cached) continue;
      const translated = await translateFn(phrase, lang);
      await setCachedTranslation(phrase, lang, translated);
    }
  }
}
