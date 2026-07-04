import { StateScraper, ScraperResult } from './types';
import { DiscoveryParams } from '../base';
import { Company } from '@/types/company';

export class TCEQScraper implements StateScraper {
  stateCode = 'TX';
  supportedVerticals = ['slurry_processing'];

  async scrape(params: DiscoveryParams): Promise<ScraperResult> {
    const start = Date.now();
    const { vertical } = params;

    if (!this.supportedVerticals.includes(vertical)) {
      return { success: true, records: [], latencyMs: Date.now() - start };
    }

    const browserlessUrl = process.env.BROWSERLESS_URL;
    if (!browserlessUrl) {
      return { success: true, records: [], latencyMs: Date.now() - start };
    }

    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.connectOverCDP(browserlessUrl);
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        await page.goto('https://www.tceq.texas.gov/permitting/waste-permits', {
          waitUntil: 'networkidle',
          timeout: 15000,
        });

        const records: Partial<Company>[] = [];
        await browser.close();
        return { success: true, records, latencyMs: Date.now() - start };
      } finally {
        await browser.close().catch(() => {});
      }
    } catch (err) {
      console.warn('[TCEQScraper] Live scrape failed:', err);
      return { success: true, records: [], latencyMs: Date.now() - start };
    }
  }
}
