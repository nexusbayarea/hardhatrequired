import * as cheerio from 'cheerio';

export interface WebScrapeResult {
  matchedKeywords: string[];
  isCommercial: boolean;
  isResidential: boolean;
  isMismatch: boolean;
  licenseNumbers: string[];
  rawText: string;
}

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HardHatRequiredBot/1.0',
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const html = await response.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header').remove();
    return $('body').text();
  } catch {
    return null;
  }
}

export async function scrapeCompanyWebsite(
  url: string,
  verticalKeywords: string[],
  negativeKeywords: string[] = []
): Promise<WebScrapeResult> {
  const result: WebScrapeResult = {
    matchedKeywords: [],
    isCommercial: false,
    isResidential: false,
    isMismatch: false,
    licenseNumbers: [],
    rawText: '',
  };

  try {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const parsed = new URL(targetUrl);
    const origin = parsed.origin;

    const pages = [
      targetUrl,
      `${origin}/services`,
      `${origin}/about`,
      `${origin}/services/`,
      `${origin}/about/`,
    ];

    const pageTexts: string[] = [];
    for (const pageUrl of pages) {
      const text = await fetchPageText(pageUrl);
      if (text) pageTexts.push(text);
    }

    const combinedText = pageTexts.join('\n').toLowerCase();
    result.rawText = combinedText.slice(0, 10000);

    for (const keyword of verticalKeywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      if (regex.test(combinedText)) {
        result.matchedKeywords.push(keyword);
      }
    }

    if (/\b(commercial|industrial|enterprise|municipal|facility manager|contractor|warehouse|factory|plant)\b/i.test(combinedText)) {
      result.isCommercial = true;
    }

    if (/\b(homeowner|residential|home repair|house|apartment|condo|clogged toilet|kitchen sink|basement)\b/i.test(combinedText)) {
      result.isResidential = true;
    }

    if (
      negativeKeywords.length > 0 &&
      result.matchedKeywords.length === 0 &&
      negativeKeywords.some((kw) => {
        const regex = new RegExp(`\\b${kw.toLowerCase()}\\b`, 'i');
        return regex.test(combinedText);
      })
    ) {
      result.isMismatch = true;
    }

    const licenseRegex = /(?:lic|license|cert|licencia)\s*(?:#|no\.?:?)?\s*([0-9]{5,10})/gi;
    let match;
    while ((match = licenseRegex.exec(combinedText)) !== null) {
      result.licenseNumbers.push(match[1]);
    }

  } catch (error) {
    return result;
  }

  return result;
}
