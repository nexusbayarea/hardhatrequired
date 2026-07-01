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
  slurry_processing: [
    {
      name: 'Bay Area Slurry Solutions',
      corporateParent: 'Bay Area Slurry Solutions',
      naics: [562211, 562112],
      branches: [
        { region: 'Bay Area', city: 'San Leandro', zip: '94577', phone: '510-123-4567' },
      ],
    },
    {
      name: 'Pacific Bay Ready Mix & Slurry Processing',
      corporateParent: 'Pacific Bay Materials',
      naics: [327320, 562211],
      branches: [
        { region: 'Bay Area', city: 'Martinez', zip: '94553', phone: '925-229-2600' },
      ],
    },
    {
      name: 'Slurry Station',
      corporateParent: 'Slurry Station Inc',
      naics: [562211, 562112],
      branches: [
        { region: 'Bay Area', city: 'Santa Clara', zip: '95050', phone: '408-727-2000' },
      ],
    },
    {
      name: 'Cal-West Slurry & Concrete Services',
      corporateParent: 'Cal-West Concrete',
      naics: [238110, 562211],
      branches: [
        { region: 'Bay Area', city: 'San Jose', zip: '95112', phone: '408-287-5900' },
      ],
    },
    {
      name: 'Concrete Washout Solutions',
      corporateParent: 'Washout Solutions Inc',
      naics: [562211, 562112],
      branches: [
        { region: 'Bay Area', city: 'Oakland', zip: '94607', phone: '510-444-8000' },
      ],
    },
  ],
  hydro_excavation: [
    {
      name: 'Badger Daylighting',
      corporateParent: 'Badger Infrastructure Solutions',
      naics: [238910, 237110],
      branches: [
        { region: 'Bay Area', city: 'Hayward', zip: '94545', phone: '510-783-4090' },
        { region: 'Sacramento', city: 'Sacramento', zip: '95828', phone: '916-381-3440' },
      ],
    },
    {
      name: 'Paciwest Hydrovac',
      corporateParent: 'Paciwest Hydrovac Services',
      naics: [238910, 237110],
      branches: [
        { region: 'Bay Area', city: 'San Jose', zip: '95134', phone: '408-436-1900' },
      ],
    },
  ],
  industrial_demolition: [
    {
      name: 'Peninsula Demolition',
      corporateParent: 'Peninsula Demolition Inc',
      naics: [238910, 562910],
      branches: [
        { region: 'Bay Area', city: 'San Carlos', zip: '94070', phone: '650-593-3600' },
      ],
    },
    {
      name: 'MCM Construction',
      corporateParent: 'MCM Construction Inc',
      naics: [238910],
      branches: [
        { region: 'Bay Area', city: 'Sacramento', zip: '95826', phone: '916-362-5100' },
        { region: 'Bay Area', city: 'Hayward', zip: '94545', phone: '510-264-9900' },
      ],
    },
    {
      name: 'Alta Environmental',
      corporateParent: 'Alta Environmental Group',
      naics: [562910, 541620],
      branches: [
        { region: 'Bay Area', city: 'Livermore', zip: '94551', phone: '925-543-9000' },
      ],
    },
  ],
  asbestos_abatement: [
    {
      name: 'Triumvirate Environmental',
      corporateParent: 'Triumvirate Environmental Inc',
      naics: [562910],
      branches: [
        { region: 'Bay Area', city: 'San Leandro', zip: '94577', phone: '510-483-4500' },
      ],
    },
    {
      name: 'Clean Harbors',
      corporateParent: 'Clean Harbors Environmental Services',
      naics: [562910, 562211],
      branches: [
        { region: 'Bay Area', city: 'Benicia', zip: '94510', phone: '800-645-8265' },
        { region: 'Sacramento', city: 'Sacramento', zip: '95827', phone: '916-362-3100' },
      ],
    },
  ],
  medical_waste: [
    {
      name: 'Stericycle',
      corporateParent: 'Stericycle Inc',
      naics: [562112, 562211],
      branches: [
        { region: 'Bay Area', city: 'San Leandro', zip: '94577', phone: '510-613-8000' },
        { region: 'Sacramento', city: 'Sacramento', zip: '95827', phone: '916-369-2900' },
      ],
    },
    {
      name: 'Republic Services',
      corporateParent: 'Republic Services Inc',
      naics: [562111, 562112],
      branches: [
        { region: 'Bay Area', city: 'San Francisco', zip: '94124', phone: '415-330-8800' },
        { region: 'East Bay', city: 'Oakland', zip: '94621', phone: '510-613-8700' },
      ],
    },
  ],
  industrial_wastewater: [
    {
      name: 'Veolia North America',
      corporateParent: 'Veolia Environnement',
      naics: [221320, 562211],
      branches: [
        { region: 'Bay Area', city: 'San Francisco', zip: '94105', phone: '415-227-0551' },
      ],
    },
    {
      name: 'EnviroTech Services',
      corporateParent: 'EnviroTech Services Inc',
      naics: [562211, 541620],
      branches: [
        { region: 'Bay Area', city: 'Pleasanton', zip: '94588', phone: '925-251-1800' },
      ],
    },
  ],
  tank_testing: [
    {
      name: 'UST Environmental Services',
      corporateParent: 'UST Environmental Inc',
      naics: [541350, 562910],
      branches: [
        { region: 'Bay Area', city: 'Oakland', zip: '94607', phone: '510-272-9900' },
      ],
    },
    {
      name: 'A&B Environmental',
      corporateParent: 'A&B Environmental Services',
      naics: [541350, 562910],
      branches: [
        { region: 'Bay Area', city: 'San Jose', zip: '95112', phone: '408-287-3960' },
      ],
    },
  ],
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
