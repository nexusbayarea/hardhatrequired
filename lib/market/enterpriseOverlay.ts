import { Company } from '@/types/company';

interface EnterpriseBranch {
  region: string;
  city: string;
  zip: string;
  phone?: string;
}

interface EnterpriseEntry {
  name: string;
  corporateParent: string;
  naics: number[];
  branches: EnterpriseBranch[];
}

const ENTERPRISE_MARKET_LEADERS: Record<string, EnterpriseEntry[]> = {
  elevator_inspection: [
    {
      name: 'Otis Elevator Company',
      corporateParent: 'Otis Worldwide',
      naics: [238290],
      branches: [
        { region: 'Central Valley', city: 'Fresno', zip: '93721', phone: '559-320-6402' },
        { region: 'Bay Area', city: 'San Leandro', zip: '94577', phone: '510-483-4500' },
        { region: 'Sacramento', city: 'Sacramento', zip: '95814', phone: '916-649-9000' },
        { region: 'Los Angeles', city: 'Los Angeles', zip: '90013', phone: '213-683-0500' },
        { region: 'San Diego', city: 'San Diego', zip: '92101', phone: '619-291-7770' },
      ],
    },
    {
      name: 'Schindler Elevator Corporation',
      corporateParent: 'Schindler Group',
      naics: [238290],
      branches: [
        { region: 'Central Valley', city: 'Sacramento', zip: '95814', phone: '916-993-0800' },
        { region: 'Bay Area', city: 'Oakland', zip: '94607', phone: '510-251-2600' },
        { region: 'Los Angeles', city: 'Los Angeles', zip: '90017', phone: '213-250-3400' },
        { region: 'San Diego', city: 'San Diego', zip: '92123', phone: '858-492-2000' },
      ],
    },
    {
      name: 'TK Elevator (TKE)',
      corporateParent: 'TK Elevator',
      naics: [238290],
      branches: [
        { region: 'Central Valley', city: 'Clovis', zip: '93612', phone: '559-298-6500' },
        { region: 'Bay Area', city: 'San Francisco', zip: '94105', phone: '415-281-2900' },
        { region: 'Sacramento', city: 'Sacramento', zip: '95814', phone: '916-921-2400' },
        { region: 'Los Angeles', city: 'Los Angeles', zip: '90015', phone: '213-747-9800' },
      ],
    },
    {
      name: 'KONE Elevator Company',
      corporateParent: 'KONE Corporation',
      naics: [238290],
      branches: [
        { region: 'Bay Area', city: 'San Francisco', zip: '94107', phone: '415-348-0777' },
        { region: 'Sacramento', city: 'Sacramento', zip: '95834', phone: '916-928-3400' },
        { region: 'Los Angeles', city: 'Los Angeles', zip: '90041', phone: '323-258-5500' },
      ],
    },
    {
      name: 'Mitsubishi Electric Elevator',
      corporateParent: 'Mitsubishi Electric',
      naics: [238290],
      branches: [
        { region: 'Bay Area', city: 'San Francisco', zip: '94111', phone: '415-399-7300' },
        { region: 'Los Angeles', city: 'Los Angeles', zip: '90045', phone: '310-670-3100' },
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
      results.push({
        id: `enterprise_${verticalId}_${entry.corporateParent.replace(/\s+/g, '_').toLowerCase()}_${branch.city.replace(/\s+/g, '_').toLowerCase()}`,
        companyName: `${entry.name} - ${branch.city} Branch`,
        phone: branch.phone,
        city: branch.city,
        zip: branch.zip,
        notes: `${entry.corporateParent} — Enterprise market leader. Regional service center covering ${branch.region}.`,
        source: 'enterprise_overlay',
        status: 'NOT_CONTACTED',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  return results;
}
