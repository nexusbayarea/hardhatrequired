import { Company } from '@/types/company';

interface EnterpriseBranch {
  region: string;
  city: string;
  zip: string;
  phone?: string;
  website?: string;
  permitted?: boolean;
}

interface EnterpriseEntry {
  name: string;
  corporateParent: string;
  naics: number[];
  branches: EnterpriseBranch[];
}

const ENTERPRISE_MARKET_LEADERS: Record<string, EnterpriseEntry[]> = {
  slurry_processing: [
    {
      name: 'Bay Area Slurry Solutions',
      corporateParent: 'Bay Area Slurry Solutions',
      naics: [562211, 562112],
      branches: [
        { region: 'Bay Area', city: 'San Leandro', zip: '94577', phone: '510-123-4567', website: 'bayareaslurry.com', permitted: true },
      ],
    },
    {
      name: 'Pacific Bay Ready Mix & Slurry Processing',
      corporateParent: 'Pacific Bay Materials',
      naics: [327320, 562211],
      branches: [
        { region: 'Bay Area', city: 'Martinez', zip: '94553', phone: '925-229-2600', website: 'pacificbaymaterials.com', permitted: true },
      ],
    },
    {
      name: 'Slurry Station',
      corporateParent: 'Slurry Station Inc',
      naics: [562211, 562112],
      branches: [
        { region: 'Bay Area', city: 'Santa Clara', zip: '95050', phone: '408-727-2000', permitted: true },
      ],
    },
    {
      name: 'Cal-West Slurry & Concrete Services',
      corporateParent: 'Cal-West Concrete',
      naics: [238110, 562211],
      branches: [
        { region: 'Bay Area', city: 'San Jose', zip: '95112', phone: '408-287-5900', permitted: true },
      ],
    },
    {
      name: 'Concrete Washout Solutions',
      corporateParent: 'Washout Solutions Inc',
      naics: [562211, 562112],
      branches: [
        { region: 'Bay Area', city: 'Oakland', zip: '94607', phone: '510-444-8000', permitted: true },
      ],
    },
  ],
  asbestos_abatement: [
    {
      name: 'Triumvirate Environmental',
      corporateParent: 'Triumvirate Environmental Inc',
      naics: [562910],
      branches: [
        { region: 'Bay Area', city: 'San Leandro', zip: '94577', phone: '510-483-4500', website: 'triumvirate.com' },
      ],
    },
    {
      name: 'Clean Harbors',
      corporateParent: 'Clean Harbors Environmental Services',
      naics: [562910, 562211],
      branches: [
        { region: 'Bay Area', city: 'Benicia', zip: '94510', phone: '800-645-8265', website: 'cleanharbors.com', permitted: true },
        { region: 'Sacramento', city: 'Sacramento', zip: '95827', phone: '916-362-3100', website: 'cleanharbors.com', permitted: true },
      ],
    },
  ],
  medical_waste: [
    {
      name: 'Stericycle',
      corporateParent: 'Stericycle Inc',
      naics: [562112, 562211],
      branches: [
        { region: 'Bay Area', city: 'San Leandro', zip: '94577', phone: '510-613-8000', website: 'stericycle.com', permitted: true },
        { region: 'Sacramento', city: 'Sacramento', zip: '95827', phone: '916-369-2900', website: 'stericycle.com', permitted: true },
      ],
    },
    {
      name: 'Republic Services',
      corporateParent: 'Republic Services Inc',
      naics: [562111, 562112],
      branches: [
        { region: 'Bay Area', city: 'San Francisco', zip: '94124', phone: '415-330-8800', website: 'republicservices.com', permitted: true },
        { region: 'East Bay', city: 'Oakland', zip: '94621', phone: '510-613-8700', website: 'republicservices.com', permitted: true },
      ],
    },
  ],
  industrial_wastewater: [
    {
      name: 'Veolia North America',
      corporateParent: 'Veolia Environnement',
      naics: [221320, 562211],
      branches: [
        { region: 'Bay Area', city: 'San Francisco', zip: '94105', phone: '415-227-0551', website: 'veolia.com', permitted: true },
      ],
    },
  ],
};

export function getEnterpriseOverlay(verticalId: string, targetZip: string, targetRadiusMiles: number): Partial<Company>[] {
  const entries = ENTERPRISE_MARKET_LEADERS[verticalId];
  if (!entries) return [];

  const results: Partial<Company>[] = [];
  const now = new Date().toISOString();

  for (const entry of entries) {
    for (const branch of entry.branches) {
      const company: Partial<Company> = {
        id: `enterprise_${verticalId}_${entry.corporateParent.replace(/\s+/g, '_').toLowerCase()}_${branch.city.replace(/\s+/g, '_').toLowerCase()}`,
        companyName: `${entry.name} - ${branch.city} Branch`,
        phone: branch.phone,
        website: branch.website,
        city: branch.city,
        zip: branch.zip,
        notes: `${entry.corporateParent} — Enterprise market leader. Regional service center covering ${branch.region}.`,
        source: 'enterprise_overlay',
        status: 'NOT_CONTACTED',
        createdAt: now,
        updatedAt: now,
      };

      if (branch.permitted) {
        company.permits = [{ permitNumber: 'Enterprise', type: 'Enterprise Facility', status: 'Active' }];
      }

      results.push(company);
    }
  }

  return results;
}
