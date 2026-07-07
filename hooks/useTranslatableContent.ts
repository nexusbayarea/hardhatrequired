'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

const translationCache: Record<string, Record<string, any>> = {};

export function useTranslatableContent<T extends Record<string, any>>(
  items: T[] | null,
  translatableKeys: (keyof T)[],
  itemUniqueKey: keyof T = 'id'
) {
  const { language } = useLanguage();
  const [translatedItems, setTranslatedItems] = useState<T[] | null>(items);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (!items || items.length === 0) {
      setTranslatedItems(items);
      return;
    }

    if (language === 'en') {
      setTranslatedItems(items);
      return;
    }

    if (!translationCache[language]) {
      translationCache[language] = {};
    }

    const results: T[] = [];
    const payloadToTranslate: { itemIndex: number; key: keyof T; text: string; cacheKey: string }[] = [];

    items.forEach((item, index) => {
      const itemId = String(item[itemUniqueKey]);
      const cachedItem = translationCache[language][itemId];
      if (cachedItem) {
        results[index] = { ...item, ...cachedItem };
      } else {
        results[index] = { ...item };
        translatableKeys.forEach((key) => {
          const rawText = item[key];
          if (typeof rawText === 'string' && rawText.trim()) {
            payloadToTranslate.push({
              itemIndex: index,
              key,
              text: rawText,
              cacheKey: itemId,
            });
          }
        });
      }
    });

    if (payloadToTranslate.length === 0) {
      setTranslatedItems(results);
      return;
    }

    async function executeBatchTranslation() {
      setTranslating(true);
      try {
        const textsToTranslate = payloadToTranslate.map(p => p.text);
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textsToTranslate, target: language }),
        });

        if (!response.ok) throw new Error('Translation API call failed');
        const data = await response.json();

        if (data.success && Array.isArray(data.translatedText)) {
          payloadToTranslate.forEach((item, idx) => {
            const translatedVal = data.translatedText[idx];
            results[item.itemIndex][item.key] = translatedVal;

            if (!translationCache[language][item.cacheKey]) {
              translationCache[language][item.cacheKey] = {};
            }
            translationCache[language][item.cacheKey][item.key as string] = translatedVal;
          });

          setTranslatedItems([...results]);
        }
      } catch (err) {
        console.warn('Dynamic landing page translation failed, using English fallback:', err);
        setTranslatedItems(items);
      } finally {
        setTranslating(false);
      }
    }

    executeBatchTranslation();
  }, [language, items, translatableKeys, itemUniqueKey]);

  return { translatedItems, translating };
}
