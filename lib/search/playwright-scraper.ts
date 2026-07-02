import { Company } from '@/types/company';
import { VerticalConfig } from '@/types/config';

const DEEP_SCRAPE_TIMEOUT = 15_000;
const MAX_PAGES = 3;

// Guards against multiple concurrent Chromium launches — only one Playwright
// instance may run at a time to prevent memory exhaustion in serverless.
let playwrightLock = false;
const playwrightQueue: Array<() => void> = [];

async function acquirePlaywrightLock(): Promise<void> {
  if (!playwrightLock) {
    playwrightLock = true;
    return;
  }
  return new Promise<void>(resolve => {
    playwrightQueue.push(() => {
      playwrightLock = true;
      resolve();
    });
  });
}

function releasePlaywrightLock(): void {
  const next = playwrightQueue.shift();
  if (next) {
    next();
  } else {
    playwrightLock = false;
  }
}

export interface DeepScrapeResult {
  scrapedIsCommercial: boolean;
  scrapedIsResidential: boolean;
  scrapedIsMismatch: boolean;
  scrapedKeywords: string[];
  scrapedLicenseNumbers: string[];
  scrapedText: string;
}

export async function deepScrapeCompany(
  company: Partial<Company>,
  config: VerticalConfig
): Promise<DeepScrapeResult> {
  if (!company.website) {
    return {
      scrapedIsCommercial: false,
      scrapedIsResidential: false,
      scrapedIsMismatch: false,
      scrapedKeywords: [],
      scrapedLicenseNumbers: [],
      scrapedText: '',
    };
  }

  try {
    const signalTerms = [
      ...(config.signals?.primary || []).map(s => s.term),
      ...(config.signals?.secondary || []).map(s => s.term),
    ];

    const result = await scrapeWithPlaywright(company.website, signalTerms);

    const lowerText = result.text.toLowerCase();
    const keywords = signalTerms.filter(t => lowerText.includes(t.toLowerCase()));
    const isCommercial = !lowerText.includes('residential') || keywords.length >= 2;
    const isResidential = lowerText.includes('residential') && !isCommercial;
    const hasNegative = (config.signals?.negative || []).some(n =>
      lowerText.includes(n.term.toLowerCase())
    );

    return {
      scrapedIsCommercial: isCommercial && !hasNegative,
      scrapedIsResidential: isResidential,
      scrapedIsMismatch: hasNegative,
      scrapedKeywords: keywords,
      scrapedLicenseNumbers: result.licenses,
      scrapedText: result.text.slice(0, 3000),
    };
  } catch {
    return {
      scrapedIsCommercial: false,
      scrapedIsResidential: false,
      scrapedIsMismatch: false,
      scrapedKeywords: [],
      scrapedLicenseNumbers: [],
      scrapedText: '',
    };
  }
}

interface ScrapePageResult {
  text: string;
  licenses: string[];
}

async function scrapeWithPlaywright(
  baseUrl: string,
  signalTerms: string[]
): Promise<ScrapePageResult> {
  await acquirePlaywrightLock();
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true }).catch(() => null);
  if (!browser) {
    releasePlaywrightLock();
    return { text: '', licenses: [] };
  }

  try {
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0' });
    const page = await context.newPage();

    const urlsToVisit = buildUrlsToScrape(baseUrl);
    let combinedText = '';
    const licenses: string[] = [];
    const visited = new Set<string>();

    for (const url of urlsToVisit) {
      if (visited.has(url)) continue;
      visited.add(url);
      if (combinedText.length > 5000) break;

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: DEEP_SCRAPE_TIMEOUT });
        const text = await page.evaluate(() => {
          const main = document.querySelector('main, article, .content, #content, .services');
          if (main) return (main as HTMLElement).innerText;
          return document.body?.innerText || '';
        });

        const cleaned = cleanText(text);
        combinedText += cleaned + '\n';

        const found = extractLicenseNumbers(cleaned);
        licenses.push(...found);
      } catch {
        continue;
      }
    }

    return { text: combinedText, licenses: [...new Set(licenses)] };
  } finally {
    await browser.close().catch(() => {});
    releasePlaywrightLock();
  }
}

function buildUrlsToScrape(baseUrl: string): string[] {
  const normalized = baseUrl.replace(/\/$/, '');
  const urls: string[] = [normalized];

  const paths = ['/services', '/about', '/capabilities', '/about-us'];
  for (const p of paths) {
    urls.push(`${normalized}${p}`);
  }

  return urls.slice(0, MAX_PAGES);
}

function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .slice(0, 5000);
}

const LICENSE_PATTERNS = [
  /\b\d{6,10}\b/g,
  /\b(?:CSLB|LIC)#?\s*(\d+)/gi,
  /\b(?:CA|TX|NV|AZ|FL|NY)\s*\d{6,10}\b/gi,
];

function extractLicenseNumbers(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of LICENSE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) found.add(m);
    }
  }
  return [...found];
}
