import { BidResult, BidSource, BidStatus, HHRGrade } from '@/types/indexes';
import { VerticalConfig } from '@/types/config';

// ─── Bid Intelligence Index ────────────────────────────────────────────────────
//
// Discovers open bids, RFPs, and contracts across 5 source types:
//   B1: City Bids      — municipal purchasing portals
//   B2: County Bids    — county procurement systems
//   B3: State DOT      — state transportation department contracts
//   B4: Utilities      — utility company RFPs (PG&E, SCE, ERCOT, etc.)
//   B5: Private        — GC invitation-to-bid platforms
//
// Discovery strategy per source:
//   - Public portals: scrape via structured URL patterns (state-specific)
//   - SAM.gov (federal): REST API with NAICS filtering
//   - Demandstar / OpenGov: commercial APIs (requires partner key)
//   - Newforma / Procore: private GC portals (invitation-only)
//
// For now, the SAM.gov integration is live. State/county portals are stubbed
// with the URL pattern framework so they can be wired in one by one.
// ──────────────────────────────────────────────────────────────────────────────

const SAM_GOV_API_BASE = 'https://api.sam.gov/opportunities/v2/search';

export class BidIntelligenceIndex {

  // ── Main search entry ─────────────────────────────────────────────────────
  async search(params: {
    verticalConfig: VerticalConfig;
    state: string;
    zip: string;
    sources?: BidSource[];
    activeOnly?: boolean;
  }): Promise<BidResult[]> {
    const sources = params.sources ?? ['city', 'county', 'state_dot', 'utility', 'private'];
    const results: BidResult[] = [];

    const tasks: Promise<BidResult[]>[] = [];

    if (sources.includes('state_dot') || sources.includes('city') || sources.includes('county')) {
      tasks.push(this.searchSamGov(params.verticalConfig, params.state));
    }

    if (sources.includes('utility')) {
      tasks.push(this.searchUtilityPortals(params.verticalConfig, params.state));
    }

    const settled = await Promise.allSettled(tasks);
    for (const r of settled) {
      if (r.status === 'fulfilled') results.push(...r.value);
    }

    // Score and filter
    const scored = results
      .map((bid) => this.scoreBid(bid, params.verticalConfig))
      .filter((bid) => bid.grade !== 'D');

    if (params.activeOnly) {
      return scored.filter((b) => b.status === 'open' || b.status === 'closing_soon');
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  // ── SAM.gov integration (federal + state contracts) ───────────────────────
  private async searchSamGov(
    config: VerticalConfig,
    state: string
  ): Promise<BidResult[]> {
    const apiKey = process.env.SAM_GOV_API_KEY;
    if (!apiKey) {
      console.warn('[BidIntelligenceIndex] SAM_GOV_API_KEY not configured — skipping federal bids');
      return [];
    }

    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        limit: '25',
        offset: '0',
        postedFrom: this.daysAgo(90),
        postedTo: this.today(),
        ptype: 'o,p,k,s',   // Solicitation, Pre-sol, Combined, Sale
        state,
        naics: config.targetNaicsCodes.join(','),
      });

      const response = await fetch(`${SAM_GOV_API_BASE}?${params}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const opps = data.opportunitiesData || [];

      return opps.map((opp: SamGovOpportunity) => this.mapSamGovToBid(opp, config.id));
    } catch (err) {
      console.error('[BidIntelligenceIndex] SAM.gov search failed:', err);
      return [];
    }
  }

  // ── Utility portal stubs (extend per utility) ─────────────────────────────
  //
  // Each utility has a different portal. These are URL patterns that return
  // search results we can parse. Add a parser per utility as needed.
  //
  private async searchUtilityPortals(
    config: VerticalConfig,
    state: string
  ): Promise<BidResult[]> {
    const UTILITY_PORTALS: Record<string, string> = {
      CA: 'https://supplier.pge.com/irj/portal/sourcing',
      TX: 'https://www.oncor.com/EN/business/suppliers/Pages/sourcingopportunities.aspx',
      NY: 'https://www.coned.com/en/business-partners/suppliers',
      FL: 'https://www.fpl.com/business/working-with-us/suppliers.html',
    };

    const portalUrl = UTILITY_PORTALS[state];
    if (!portalUrl) return [];

    // Utility portals require auth or JS rendering — return a discoverable stub
    // that the UI can surface as "manual check required"
    const stub: BidResult = {
      id: `utility-${state}-${config.id}-${Date.now()}`,
      index: 'bid_intelligence',
      title: `${state} Utility Supplier Opportunities — ${config.industryName}`,
      agency: `${state} Regional Utilities`,
      source: 'utility',
      status: 'open',
      description: `Check the regional utility portal for ${config.industryName} subcontracting opportunities. Requires supplier registration.`,
      verticalId: config.id,
      state,
      documentUrl: portalUrl,
      naicsCodes: config.targetNaicsCodes,
      score: 60,
      grade: 'C',
      matchedSignals: ['utility portal'],
      createdAt: new Date().toISOString(),
    };

    return [stub];
  }

  // ── Score a bid against a vertical config ─────────────────────────────────
  private scoreBid(bid: BidResult, config: VerticalConfig): BidResult {
    let score = 0;
    const matched: string[] = [];

    const searchText = [bid.title, bid.description, bid.agency]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Primary signal matches
    for (const sig of config.signals.primary) {
      if (searchText.includes(sig.term.toLowerCase())) {
        score += sig.weight;
        matched.push(sig.term);
      }
    }

    // Secondary signal matches
    for (const sig of config.signals.secondary) {
      if (searchText.includes(sig.term.toLowerCase())) {
        score += sig.weight;
        matched.push(sig.term);
      }
    }

    // NAICS code match — strong signal
    if (bid.naicsCodes?.some((n) => config.targetNaicsCodes.includes(n))) {
      score += 30;
      matched.push('naics_match');
    }

    // Recency bonus
    if (bid.dueAt) {
      const daysUntilDue = Math.ceil(
        (new Date(bid.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilDue >= 0 && daysUntilDue <= 7)  { score += 20; bid.status = 'closing_soon'; }
      else if (daysUntilDue > 7 && daysUntilDue <= 30) score += 10;
    }

    // Estimated value bonus
    if (bid.estimatedValue) {
      if (bid.estimatedValue >= 1_000_000) score += 15;
      else if (bid.estimatedValue >= 100_000) score += 8;
    }

    score = Math.round(score);
    const grade = this.scoreToGrade(score);

    return { ...bid, score, grade, matchedSignals: matched };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private scoreToGrade(score: number): HHRGrade {
    if (score >= 90) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }

  private mapSamGovToBid(opp: SamGovOpportunity, verticalId: string): BidResult {
    const status: BidStatus =
      opp.active === 'Yes' ? 'open' :
      opp.award ? 'awarded' :
      'closed';

    return {
      id: `samgov-${opp.noticeId}`,
      index: 'bid_intelligence',
      title: opp.title || 'Untitled Opportunity',
      agency: opp.department || opp.agency || 'Federal Agency',
      source: this.classifySamGovSource(opp),
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
      score: 0,
      grade: 'D',
      matchedSignals: [],
      createdAt: new Date().toISOString(),
    };
  }

  private classifySamGovSource(opp: SamGovOpportunity): BidSource {
    const dept = (opp.department || '').toLowerCase();
    if (dept.includes('transport') || dept.includes('dot')) return 'state_dot';
    if (dept.includes('army corps') || dept.includes('navy') || dept.includes('air force')) return 'city';
    return 'federal' as BidSource;  // extends base BidSource for federal
  }

  private daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }
}

// ─── SAM.gov API types (partial) ─────────────────────────────────────────────

interface SamGovOpportunity {
  noticeId?: string;
  title?: string;
  solicitationNumber?: string;
  department?: string;
  agency?: string;
  description?: string;
  naicsCode?: string;
  active?: string;
  postedDate?: string;
  responseDeadLine?: string;
  uiLink?: string;
  placeOfPerformance?: {
    state?: { code?: string };
    city?: { name?: string };
  };
  pointOfContact?: Array<{
    fullName?: string;
    email?: string;
    phone?: string;
  }>;
  award?: {
    date?: string;
    amount?: string | number;
    awardee?: { name?: string };
  };
}

// Singleton
export const bidIntelligenceIndex = new BidIntelligenceIndex();
