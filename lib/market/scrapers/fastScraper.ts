export interface FastScrapeResult {
  hasJsonLd: boolean;
  schemaData: Record<string, any> | null;
  extractedPhone: string | undefined;
  extractedEmail: string | undefined;
  rawDescription: string;
}

export class FastJsonLdScraper {
  async extractBusinessData(url: string): Promise<FastScrapeResult | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IndexIntelligenceEngine/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) return null;
      const html = await response.text();

      const jsonLdBlocks = this.extractJsonLd(html);
      const businessSchema = jsonLdBlocks.find(
        (b: any) =>
          b['@type'] === 'LocalBusiness' ||
          b['@type'] === 'Organization' ||
          b['@type'] === 'Corporation'
      );

      const description =
        html.match(
          /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i
        )?.[1] || '';

      const email =
        html.match(
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
        )?.[0] || undefined;

      const phone =
        html.match(
          /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/
        )?.[0] || undefined;

      return {
        hasJsonLd: !!businessSchema,
        schemaData: businessSchema || null,
        extractedPhone: businessSchema?.telephone || phone,
        extractedEmail: businessSchema?.email || email,
        rawDescription: businessSchema?.description || description,
      };
    } catch (error) {
      console.warn(`[FastJsonLdScraper] Failed for ${url}`);
      return null;
    }
  }

  private extractJsonLd(html: string): Record<string, any>[] {
    const regex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
    const blocks: Record<string, any>[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) blocks.push(...parsed);
        else blocks.push(parsed);
      } catch {
        // Skip malformed JSON-LD
      }
    }

    return blocks;
  }
}
