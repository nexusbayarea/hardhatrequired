import * as cheerio from 'cheerio';

export interface WebScrapeResult {
  matchedKeywords: string[];
  isCommercial: boolean;
  isResidential: boolean;
  licenseNumbers: string[];
  rawText: string;
}

export async function scrapeCompanyWebsite(
  url: string,
  verticalKeywords: string[]
): Promise<WebScrapeResult> {
  const result: WebScrapeResult = {
    matchedKeywords: [],
    isCommercial: false,
    isResidential: false,
    licenseNumbers: [],
    rawText: '',
  };

  try {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HardHatRequiredBot/1.0',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) return result;
    const html = await response.text();

    const $ = cheerio.load(html);
    $('script, style, nav, footer, header').remove();

    const bodyText = $('body').text().toLowerCase();
    result.rawText = bodyText.slice(0, 5000);

    for (const keyword of verticalKeywords) {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
      if (regex.test(bodyText)) {
        result.matchedKeywords.push(keyword);
      }
    }

    if (/\b(commercial|industrial|enterprise|municipal|facility manager|contractor|warehouse|factory|plant)\b/i.test(bodyText)) {
      result.isCommercial = true;
    }

    if (/\b(homeowner|residential|home repair|house|apartment|condo|clogged toilet|kitchen sink|basement)\b/i.test(bodyText)) {
      result.isResidential = true;
    }

    const licenseRegex = /(?:lic|license|cert|licencia)\s*(?:#|no\.?:?)?\s*([0-9]{5,10})/gi;
    let match;
    while ((match = licenseRegex.exec(bodyText)) !== null) {
      result.licenseNumbers.push(match[1]);
    }

  } catch (error) {
    return result;
  }

  return result;
}
