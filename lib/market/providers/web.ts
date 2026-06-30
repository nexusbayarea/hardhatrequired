import { Company } from '@/types/company';
import { DiscoveryProvider, DiscoveryParams } from './base';

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

interface BraveSearchResponse {
  web?: {
    results: BraveWebResult[];
  };
  query?: {
    original: string;
  };
}

export class WebSearchProvider implements DiscoveryProvider {
  name = 'web_search';
  private apiKey = process.env.BRAVE_API_KEY;

  async search(params: DiscoveryParams): Promise<Partial<Company>[]> {
    if (!this.apiKey) return [];

    const searchQueries = params.searchQueries?.length
      ? params.searchQueries
      : [params.verticalConfig?.industryName || 'business'].filter(Boolean);

    const allResults: Partial<Company>[] = [];
    const seen = new Set<string>();

    for (const query of searchQueries) {
      try {
        const results = await this.searchWeb(query, params.zip);
        for (const r of results) {
          const key = (r.companyName || '').toLowerCase().trim();
          if (key && !seen.has(key)) {
            seen.add(key);
            allResults.push(r);
          }
        }
      } catch (err) {
        console.error(`[WebSearchProvider] Query '${query}' failed:`, err);
      }
    }

    return allResults;
  }

  private async searchWeb(query: string, zip: string): Promise<Partial<Company>[]> {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query + ' ' + zip)}&count=10`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': this.apiKey!,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`[WebSearchProvider] Brave API returned ${response.status}`);
      return [];
    }

    const data: BraveSearchResponse = await response.json();
    const results = data.web?.results || [];

    const now = new Date().toISOString();

    return results
      .filter(r => r.title && r.url)
      .map(r => ({
        companyName: this.extractCompanyName(r.title, r.url),
        website: r.url,
        notes: r.description || undefined,
        source: this.name,
        status: 'NOT_CONTACTED' as const,
        createdAt: now,
        updatedAt: now,
      }));
  }

  private extractCompanyName(title: string, url: string): string {
    const pipeIdx = title.indexOf(' | ');
    const hyphenIdx = title.indexOf(' - ');
    const candidate = pipeIdx > 0 ? title.substring(0, pipeIdx)
      : hyphenIdx > 0 ? title.substring(0, hyphenIdx)
      : title;
    const trimmed = candidate.trim();
    if (trimmed.length > 0 && trimmed.length <= 80) return trimmed;
    try {
      return new URL(url).hostname.replace(/^www\./, '').split('.')[0] || trimmed;
    } catch {
      return trimmed;
    }
  }
}
