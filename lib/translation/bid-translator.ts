export interface TranslatableBid {
  id: string;
  title: string;
  agencyOrClient: string;
  extractedScope: string;
  locationCity?: string;
}

const translationCache: Record<string, Record<string, TranslatableBid>> = {};

export async function translateBidsList(
  bids: TranslatableBid[],
  targetLanguage: string
): Promise<TranslatableBid[]> {
  if (!bids || bids.length === 0 || targetLanguage === 'en') {
    return bids;
  }

  if (!translationCache[targetLanguage]) {
    translationCache[targetLanguage] = {};
  }

  const result: TranslatableBid[] = [];
  const toTranslate: { index: number; text: string; field: 'title' | 'agency' | 'scope' | 'city'; bidId: string }[] = [];

  bids.forEach((bid, i) => {
    const cached = translationCache[targetLanguage][bid.id];
    if (cached) {
      result[i] = cached;
    } else {
      result[i] = { ...bid };

      toTranslate.push(
        { index: i, text: bid.title, field: 'title', bidId: bid.id },
        { index: i, text: bid.agencyOrClient, field: 'agency', bidId: bid.id },
        { index: i, text: bid.extractedScope, field: 'scope', bidId: bid.id },
        ...(bid.locationCity ? [{ index: i, text: bid.locationCity, field: 'city' as const, bidId: bid.id }] : [])
      );
    }
  });

  if (toTranslate.length === 0) {
    return result;
  }

  try {
    const textList = toTranslate.map(item => item.text);

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: textList,
        target: targetLanguage
      })
    });

    const data = await response.json();

    if (data.success && Array.isArray(data.translatedText)) {
      toTranslate.forEach((item, index) => {
        const translatedString = data.translatedText[index];
        if (item.field === 'title') {
          result[item.index].title = translatedString;
        } else if (item.field === 'agency') {
          result[item.index].agencyOrClient = translatedString;
        } else if (item.field === 'scope') {
          result[item.index].extractedScope = translatedString;
        } else if (item.field === 'city') {
          result[item.index].locationCity = translatedString;
        }

        translationCache[targetLanguage][item.bidId] = { ...result[item.index] };
      });
    }

  } catch (error) {
    console.error('HHR Bid Translation Engine experienced an API failure:', error);
  }

  return result;
}
