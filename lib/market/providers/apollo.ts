import { Company, Contact } from '@/types/company';

export interface ApolloEnrichResult {
  companyFields: Partial<Company>;
  contacts: Partial<Contact>[];
}

export class ApolloAdapter {
  name = 'apollo';

  async enrich(company: Partial<Company>): Promise<ApolloEnrichResult> {
    const empty: ApolloEnrichResult = { companyFields: {}, contacts: [] };
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey || !company.website) {
      return empty;
    }

    try {
      const cleanDomain = company.website
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .split('/')[0];

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
        return empty;
      }

      const data = await response.json();
      const org = data.organization || {};

      const now = new Date().toISOString();

      const apolloDescriptionParts: string[] = [];

      if (org.short_description) {
        apolloDescriptionParts.push(org.short_description);
      }

      if (Array.isArray(org.keywords) && org.keywords.length > 0) {
        apolloDescriptionParts.push(org.keywords.join(' '));
      } else if (typeof org.keywords === 'string' && org.keywords) {
        apolloDescriptionParts.push(org.keywords);
      }

      if (org.industry) {
        apolloDescriptionParts.push(org.industry);
      }

      if (Array.isArray(org.sic_codes) && org.sic_codes.length > 0) {
        apolloDescriptionParts.push(org.sic_codes.join(' '));
      }

      if (org.raw_description && org.raw_description !== org.short_description) {
        apolloDescriptionParts.push((org.raw_description as string).slice(0, 400));
      }

      const apolloDescription = apolloDescriptionParts
        .filter(Boolean)
        .join(' | ')
        .trim() || undefined;

      const companyFields: Partial<Company> = {
        email: org.primary_contact_email || undefined,
        phone: company.phone || org.phone || undefined,
        apolloDescription,
        source: `${company.source}+${this.name}`,
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

      return { companyFields, contacts };
    } catch (err) {
      console.error('Apollo Enrichment execution failure:', err);
      return empty;
    }
  }
}
