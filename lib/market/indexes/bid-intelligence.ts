import { BidResult, BidSource, BidStatus, HHRGrade } from '@/types/indexes';
import { VerticalConfig } from '@/types/config';
import * as cheerio from 'cheerio';

export type ProviderStatus = 'ready' | 'not_implemented' | 'unconfigured' | 'error';

export interface ProviderResult {
  provider: string;
  status: ProviderStatus;
  results: BidResult[];
  message?: string;
}

interface SearchFilters {
  verticalConfig: VerticalConfig;
  state: string;
  zip: string;
  sources?: BidSource[];
  activeOnly?: boolean;
}

interface BidProvider {
  readonly name: string;
  search(filters: SearchFilters): Promise<ProviderResult>;
}

/** Shared helpers used by all providers. */
const HHR = {
  daysAgo(d: number): string {
    const dt = new Date(); dt.setDate(dt.getDate() - d);
    return dt.toISOString().split('T')[0];
  },
  today(): string {
    return new Date().toISOString().split('T')[0];
  },
  classifySource(dept?: string): BidSource {
    const d = (dept || '').toLowerCase();
    if (d.includes('transport') || d.includes('dot')) return 'state_dot';
    return 'city';
  },
  makeBid(opts: {
    id: string; title: string; agency: string; bidNumber?: string;
    description?: string; verticalId: string; state: string; city?: string;
    estimatedValue?: number; publishedAt?: string; dueAt?: string;
    awardedAt?: string; awardedTo?: string; awardedAmount?: number;
    documentUrl?: string; contactName?: string; contactEmail?: string;
    contactPhone?: string; naicsCodes?: string[];
    source?: BidSource; status?: BidStatus;
  }): BidResult {
    return {
      ...opts,
      index: 'bid_intelligence',
      source: opts.source || 'city',
      status: opts.status || 'open',
      score: 0,
      grade: 'D',
      matchedSignals: [],
      createdAt: new Date().toISOString(),
    };
  },
};

class SamGovProvider implements BidProvider {
  readonly name = 'SAM.gov';

  async search(filters: SearchFilters): Promise<ProviderResult> {
    const apiKey = process.env.SAM_GOV_API_KEY;
    if (!apiKey) {
      return {
        provider: this.name,
        status: 'unconfigured',
        results: [],
        message: 'SAM_GOV_API_KEY not set',
      };
    }

    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        limit: '25',
        offset: '0',
        postedFrom: HHR.daysAgo(90),
        postedTo: HHR.today(),
        ptype: 'o,p,k,s',
        state: filters.state,
        naics: filters.verticalConfig.targetNaicsCodes.join(','),
      });

      const response = await fetch(`https://api.sam.gov/opportunities/v2/search?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        return {
          provider: this.name,
          status: 'error',
          results: [],
          message: `SAM.gov returned ${response.status}`,
        };
      }

      const data = await response.json();
      const opps = data.opportunitiesData || [];

      return {
        provider: this.name,
        status: 'ready',
        results: opps.map((opp: any) => this.mapToBid(opp, filters.verticalConfig.id)),
      };
    } catch (err: any) {
      return {
        provider: this.name,
        status: 'error',
        results: [],
        message: err.message,
      };
    }
  }

  private mapToBid(opp: any, verticalId: string): BidResult {
    const status: BidStatus = opp.active === 'Yes' ? 'open' : opp.award ? 'awarded' : 'closed';
    return HHR.makeBid({
      id: `samgov-${opp.noticeId}`,
      title: opp.title || 'Untitled Opportunity',
      agency: opp.department || opp.agency || 'Federal Agency',
      source: HHR.classifySource(opp.department),
      status,
      bidNumber: opp.solicitationNumber,
      description: opp.description?.slice(0, 500),
      verticalId,
      state: opp.placeOfPerformance?.state?.code || '',
      city: opp.placeOfPerformance?.city?.name,
      estimatedValue: opp.award?.amount ? Number(opp.award.amount) : undefined,
      publishedAt: opp.postedDate,
      dueAt: opp.responseDeadLine,
      awardedAt: opp.award?.date,
      awardedTo: opp.award?.awardee?.name,
      awardedAmount: opp.award?.amount ? Number(opp.award.amount) : undefined,
      documentUrl: opp.uiLink,
      contactName: opp.pointOfContact?.[0]?.fullName,
      contactEmail: opp.pointOfContact?.[0]?.email,
      contactPhone: opp.pointOfContact?.[0]?.phone,
      naicsCodes: opp.naicsCode ? [opp.naicsCode] : undefined,
    });
  }
}

class CalEProcureProvider implements BidProvider {
  readonly name = 'Cal eProcure';

  private readonly searchUrl =
    'https://caleprocure.ca.gov/pages/Events-BS3/event-search.aspx';
  private readonly baseUrl = 'https://caleprocure.ca.gov';

  async search(filters: SearchFilters): Promise<ProviderResult> {
    try {
      const results = await this.scrapeSearch(filters);
      return {
        provider: this.name,
        status: results.length > 0 ? 'ready' : 'error',
        results,
        message: results.length > 0
          ? undefined
          : 'No events found on Cal eProcure',
      };
    } catch (err: any) {
      return {
        provider: this.name,
        status: 'error',
        results: [],
        message: err.message,
      };
    }
  }

  private async scrapeSearch(filters: SearchFilters): Promise<BidResult[]> {
    // 1. GET the search page to extract ASP.NET form state
    const initRes = await fetch(this.searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HHR/1.0)' },
    });
    if (!initRes.ok) throw new Error(`Cal eProcure init returned ${initRes.status}`);

    const initHtml = await initRes.text();
    const cookies = this.parseCookies(initRes);
    const $ = cheerio.load(initHtml);

    const viewState = $('#__VIEWSTATE').val() as string;
    const viewStateGen = $('#__VIEWSTATEGENERATOR').val() as string;
    const eventValidation = $('#__EVENTVALIDATION').val() as string;
    const eventTarget = 'ctl00$ctl00$ctl00$MainContent$MainContent$MainContent$btnSearch';

    // Build keywords from the vertical config's search queries
    const keywords = [
      ...filters.verticalConfig.searchQueries,
      ...filters.verticalConfig.targetNaicsCodes,
    ].join(' ');

    // 2. POST the search form
    const form = new URLSearchParams({
      __VIEWSTATE: viewState,
      __VIEWSTATEGENERATOR: viewStateGen,
      __EVENTVALIDATION: eventValidation,
      __EVENTTARGET: eventTarget,
      __EVENTARGUMENT: '',
      __LASTFOCUS: '',
      ctl00$ctl00$ctl00$MainContent$MainContent$MainContent$txtSearch: keywords,
      ctl00$ctl00$ctl00$MainContent$MainContent$MainContent$ddlStatus: 'All',
    });

    const searchRes = await fetch(this.searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; HHR/1.0)',
        Cookie: cookies,
      },
      body: form,
    });

    if (!searchRes.ok) throw new Error(`Cal eProcure search returned ${searchRes.status}`);

    const searchHtml = await searchRes.text();
    const $$ = cheerio.load(searchHtml);

    // 3. Parse the results grid
    const bids: BidResult[] = [];
    const rows = $$('table[id*="gvEvents"] tr').filter((_, el) => {
      const cls = $$(el).attr('class') || '';
      return cls.includes('Row') || cls.includes('AltRow');
    });

    rows.each((_, row) => {
      const cells = $$(row).find('td');
      if (cells.length < 6) return;

      const eventLink = $$(cells.eq(1)).find('a');
      const href = eventLink.attr('href') || '';
      const titleText = eventLink.text().trim();
      const eventId = href.match(/event\/(\d+)\/([^/]+)/);
      const agency = $$(cells.eq(2)).text().trim();
      const statusText = $$(cells.eq(3)).text().trim().toLowerCase();
      const dueDateRaw = $$(cells.eq(4)).text().trim();
      const postedDateRaw = $$(cells.eq(5)).text().trim();

      if (!titleText) return;

      const dueDate = this.parseDate(dueDateRaw);
      const postedDate = this.parseDate(postedDateRaw);

      // Estimate value based on contract type indicators in the title
      const estimatedValue = this.estimateValue(titleText);

      bids.push(HHR.makeBid({
        id: eventId ? `caleprocure-${eventId[2]}` : `caleprocure-${titleText.replace(/\s+/g, '-').slice(0, 40)}`,
        title: titleText,
        agency: agency || 'State of California',
        source: HHR.classifySource('state of california'),
        status: this.mapStatus(statusText, dueDate),
        bidNumber: eventId?.[2],
        description: titleText,
        verticalId: filters.verticalConfig.id,
        state: 'CA',
        estimatedValue,
        publishedAt: postedDate,
        dueAt: dueDate,
        documentUrl: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
      }));
    });

    return bids;
  }

  private parseCookies(res: Response): string {
    const header = res.headers.get('set-cookie');
    if (!header) return '';
    return header.split(',').map(c => c.split(';')[0].trim()).join('; ');
  }

  private parseDate(raw: string): string | undefined {
    if (!raw) return undefined;
    // Handle formats like "06/19/2026 03:00 PM" or "06/19/2026"
    const m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return undefined;
    const [_, month, day, year] = m;
    const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59Z`);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  private estimateValue(title: string): number | undefined {
    // Rough estimate based on keywords in title — real value only available
    // after scraping the detail page.
    const t = title.toLowerCase();
    if (t.includes('construction') || t.includes('infrastructure')) return 500_000;
    if (t.includes('consulting') || t.includes('professional services')) return 150_000;
    if (t.includes('it') || t.includes('software') || t.includes('technology')) return 200_000;
    return undefined;
  }

  private mapStatus(statusText: string, dueDate?: string): BidStatus {
    const s = statusText.toLowerCase();
    if (s.includes('award')) return 'awarded';
    if (s.includes('cancel')) return 'cancelled';
    if (s.includes('close')) return 'closed';

    if (dueDate) {
      const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days >= 0 && days <= 7) return 'closing_soon';
    }
    return 'open';
  }
}

class CountyProvider implements BidProvider {
  readonly name = 'County Procurement';

  async search(_filters: SearchFilters): Promise<ProviderResult> {
    return {
      provider: this.name,
      status: 'not_implemented',
      results: [],
      message: 'County procurement provider not yet implemented',
    };
  }
}

class UtilityProvider implements BidProvider {
  readonly name = 'Utility RFPs';

  async search(filters: SearchFilters): Promise<ProviderResult> {
    const portals: Record<string, string> = {
      CA: 'https://supplier.pge.com/irj/portal/sourcing',
      TX: 'https://www.oncor.com/EN/business/suppliers/Pages/sourcingopportunities.aspx',
      NY: 'https://www.coned.com/en/business-partners/suppliers',
      FL: 'https://www.fpl.com/business/working-with-us/suppliers.html',
    };

    const url = portals[filters.state];
    if (!url) {
      return {
        provider: this.name,
        status: 'not_implemented',
        results: [],
        message: `No utility portal configured for state ${filters.state}`,
      };
    }

    return {
      provider: this.name,
      status: 'not_implemented',
      results: [],
      message: `Utility RFP scraping not yet implemented for ${url}`,
    };
  }
}

class DOTProvider implements BidProvider {
  readonly name = 'DOT Portals';

  async search(_filters: SearchFilters): Promise<ProviderResult> {
    return {
      provider: this.name,
      status: 'not_implemented',
      results: [],
      message: 'DOT portal provider not yet implemented',
    };
  }
}

export class BidIntelligenceIndex {
  private providers: BidProvider[] = [
    new SamGovProvider(),
    new CalEProcureProvider(),
    new CountyProvider(),
    new UtilityProvider(),
    new DOTProvider(),
  ];

  async search(filters: SearchFilters): Promise<{
    bids: BidResult[];
    providers: ProviderResult[];
  }> {
    const results: BidResult[] = [];
    const providerResults: ProviderResult[] = [];

    const tasks = this.providers.map(p =>
      p.search(filters).catch(err => ({
        provider: p.name,
        status: 'error' as ProviderStatus,
        results: [],
        message: err.message,
      }))
    );

    const settled = await Promise.allSettled(tasks);
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        providerResults.push(r.value);
        results.push(...r.value.results);
      }
    }

    const scored = results
      .map(bid => this.scoreBid(bid, filters.verticalConfig))
      .filter(bid => bid.grade !== 'D');

    if (filters.activeOnly) {
      return {
        bids: scored.filter(b => b.status === 'open' || b.status === 'closing_soon'),
        providers: providerResults,
      };
    }

    return {
      bids: scored.sort((a, b) => b.score - a.score),
      providers: providerResults,
    };
  }

  private scoreBid(bid: BidResult, config: VerticalConfig): BidResult {
    let score = 0;
    const matched: string[] = [];

    const searchText = [bid.title, bid.description, bid.agency]
      .filter(Boolean).join(' ').toLowerCase();

    for (const sig of config.signals.primary) {
      if (searchText.includes(sig.term.toLowerCase())) {
        score += sig.weight;
        matched.push(sig.term);
      }
    }

    for (const sig of config.signals.secondary) {
      if (searchText.includes(sig.term.toLowerCase())) {
        score += sig.weight;
        matched.push(sig.term);
      }
    }

    if (bid.naicsCodes?.some(n => config.targetNaicsCodes.includes(n))) {
      score += 30;
      matched.push('naics_match');
    }

    if (bid.dueAt) {
      const days = Math.ceil((new Date(bid.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days >= 0 && days <= 7) { score += 20; bid.status = 'closing_soon'; }
      else if (days > 7 && days <= 30) score += 10;
    }

    if (bid.estimatedValue) {
      if (bid.estimatedValue >= 1_000_000) score += 15;
      else if (bid.estimatedValue >= 100_000) score += 8;
    }

    return { ...bid, score: Math.round(score), grade: this.scoreToGrade(score), matchedSignals: matched };
  }

  private scoreToGrade(score: number): HHRGrade {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }
}

export const bidIntelligenceIndex = new BidIntelligenceIndex();
