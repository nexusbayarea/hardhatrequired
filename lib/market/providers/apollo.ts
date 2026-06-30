import { Company, Contact } from '@/types/company';
import { redis, redisAvailable } from '@/lib/redis';

export interface ApolloEnrichResult {
  companyFields: Partial<Company>;
  contacts: Partial<Contact>[];
}

export class ApolloAdapter {
  name = 'apollo';

  private normalizeDomain(url: string): string {
    try {
      const parsed = new URL(
        url.startsWith('http') ? url : `https://${url}`
      );
      return parsed.hostname
        .replace(/^www\./i, '')
        .trim()
        .toLowerCase();
    } catch {
      return url
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0]
        .trim()
        .toLowerCase();
    }
  }

  async enrich(company: Partial<Company>): Promise<ApolloEnrichResult> {
    const empty: ApolloEnrichResult = { companyFields: {}, contacts: [] };
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey || !company.website) {
      return empty;
    }

    try {
      const cleanDomain = this.normalizeDomain(company.website);
      const cacheKey = `apollo:${cleanDomain}`;

      if (redisAvailable()) {
        const cached = await redis!.get(cacheKey);
        if (cached) {
          return cached as ApolloEnrichResult;
        }
      }

      const response = await fetch('https://api.apollo.io/v1/organizations/enrich', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({ domain: cleanDomain }),
      });

      if (!response.ok) {
        console.warn(`[Apollo] HTTP ${response.status}`);
        return empty;
      }

      const data = await response.json();
      if (data.error) {
        console.warn('[Apollo] API Error:', data.error);
        return empty;
      }

      const org = data.organization;
      if (!org) return empty;

      const now = new Date().toISOString();

      const parts: string[] = [];
      [
        org.short_description,
        org.raw_description?.slice(0, 500),
        org.industry,
        org.subindustry,
        org.revenue_range,
      ]
        .filter(Boolean)
        .forEach(v => parts.push(v));

      if (Array.isArray(org.keywords)) {
        parts.push(org.keywords.join(' '));
      } else if (typeof org.keywords === 'string' && org.keywords) {
        parts.push(org.keywords);
      }

      if (Array.isArray(org.technologies)) {
        parts.push(org.technologies.join(' '));
      }

      const apolloDescription = parts.join(' | ').trim() || undefined;

      const companyFields: Partial<Company> = {
        email: company.email || org.primary_contact_email || undefined,
        phone: company.phone || org.phone || undefined,
        apolloDescription,
        source: company.source
          ? `${company.source}+apollo`
          : 'apollo',
      };

      const contacts: Partial<Contact>[] = [];
      if (org.primary_contact_name) {
        const nameParts = (org.primary_contact_name as string).split(' ');
        contacts.push({
          firstName: nameParts[0] || undefined,
          lastName: nameParts.slice(1).join(' ') || undefined,
          title: org.primary_contact_title || undefined,
          email: org.primary_contact_email || undefined,
          phone: org.phone || undefined,
          linkedinUrl: org.linkedin_url || undefined,
          isPrimary: true,
          createdAt: now,
        });
      }

      const result: ApolloEnrichResult = { companyFields, contacts };

      if (redisAvailable()) {
        await redis!.set(cacheKey, result, { ex: 60 * 60 * 24 * 30 });
      }

      return result;
    } catch (err) {
      console.error('[Apollo] Enrichment failure:', err);
      return empty;
    }
  }
}
