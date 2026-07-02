export interface ScrapedSignals {
  scrapedText: string;
  scrapedKeywords: string[];
  scrapedIsCommercial: boolean;
  scrapedIsResidential: boolean;
  scrapedLicenseNumbers: string[];
}

function cleanHtmlToText(html: string): string {
  let text = html;
  text = text.replace(/<(script|style|canvas|svg|noscript)\b[^>]*>([\s\S]*?)<\/\1>/gi, ' ');
  text = text.replace(/<[^>]+>/g, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

function extractLicenseNumbers(text: string): string[] {
  const licenseRegex = /(?:lic(?:ense)?(?:\s+(?:#|no\.?))?\s*|cslb\s*#?\s*)(\d{5,8})\b/gi;
  const uniqueLicenses = new Set<string>();
  let match;
  while ((match = licenseRegex.exec(text)) !== null) {
    if (match[1]) uniqueLicenses.add(match[1]);
  }
  return Array.from(uniqueLicenses);
}

export async function harvestContractorSignals(
  targetUrl: string,
  searchKeywords: string[],
  timeoutMs = 4000
): Promise<ScrapedSignals> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IngestionEngine/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Target returned invalid HTTP status code: ${response.status}`);
    }

    const rawHtml = await response.text();
    const cleanText = cleanHtmlToText(rawHtml);
    const lowercaseText = cleanText.toLowerCase();

    const scrapedKeywords = searchKeywords.filter(keyword =>
      lowercaseText.includes(keyword.toLowerCase())
    );

    const scrapedIsCommercial = /(commercial|industrial|enterprise|warehouse|tipping fee|roll-off)/i.test(lowercaseText);
    const scrapedIsResidential = /(residential|homeowner|driveway|roofing|household)/i.test(lowercaseText);
    const scrapedLicenseNumbers = extractLicenseNumbers(cleanText);

    return {
      scrapedText: cleanText.slice(0, 10000),
      scrapedKeywords,
      scrapedIsCommercial,
      scrapedIsResidential,
      scrapedLicenseNumbers,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Scraping pipeline aborted: Destination exceeded execution timeout allocation of ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
