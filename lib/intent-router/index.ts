import type { ForemanIntent, ExtractedIntent } from '@/types/foreman';

const VERTICAL_PATTERNS: [string, RegExp[]][] = [
  ['slurry_processing', [/slurry/, /concrete slurry/]],
  ['concrete', [/concrete(?! slurry)/]],
  ['grease_trap', [/grease trap/, /grease/]],
  ['hydro_excavation', [/hydro.?exavcat/, /vac truck/, /vacuum truck/]],
  ['asbestos_abatement', [/asbestos/]],
  ['medical_waste', [/medical waste/]],
  ['industrial_wastewater', [/wastewater/, /industrial water/]],
  ['scrap_metal', [/scrap metal/, /scrap/]],
  ['tank_testing', [/tank test/]],
  ['stormwater_compliance', [/stormwater/, /storm water/]],
  ['dewatering', [/dewatering/, /de-water/]],
  ['marine_construction', [/marine/]],
  ['commercial_roofing', [/roof/]],
  ['fire_sprinkler', [/sprinkler/]],
  ['fire_extinguisher', [/extinguisher/]],
  ['hvac_balance', [/hvac/, /air balance/]],
  ['generator_testing', [/generator/]],
  ['elevator_inspection', [/elevator/]],
  ['backflow_testing', [/backflow/]],
  ['kitchen_exhaust', [/exhaust/, /kitchen hood/]],
  ['hazardous_soil_remediation', [/hazardous soil/, /soil remediation/, /contaminated/]],
  ['wind_infrastructure', [/wind/, /turbine/]],
];

const CITY_ZIPS: Record<string, string> = {
  fremont: '94538', oakland: '94607', sanfrancisco: '94102', sanjose: '95113',
  hayward: '94541', richmond: '94801', berkeley: '94704', concord: '94520',
  pleasanton: '94566', livermore: '94550', vallejo: '94590', fairfield: '94533',
  sacramento: '95814', stockton: '95202', antioch: '94509',
};

export class IntentRouter {
  route(message: string): ExtractedIntent {
    const lower = message.toLowerCase().trim();
    const params: Record<string, any> = {};

    const bidKeywords = ['bid', 'proposal', 'rfp', 'scope', 'estimate project', 'help me bid'];
    const logisticsKeywords = ['hauling', 'logistics', 'estimate cost', 'gallons', 'transport', 'per gallon', 'cost per'];
    const equipmentKeywords = ['rent', 'equipment', 'vacuum truck', 'boom truck', 'skip loader', 'trailer'];
    const complianceKeywords = ['compliance', 'permit', 'regulation', 'certification', 'license', 'calrecycle'];
    const translateKeywords = ['translate', 'in spanish', 'in chinese', 'in vietnamese', 'in english'];

    const hasBid = bidKeywords.some(k => lower.includes(k));
    const hasLogistics = logisticsKeywords.some(k => lower.includes(k));
    const hasEquipment = equipmentKeywords.some(k => lower.includes(k));
    const hasCompliance = complianceKeywords.some(k => lower.includes(k));
    const hasTranslate = translateKeywords.some(k => lower.includes(k));
    const hasSearch = lower.includes('find') || lower.includes('search') || lower.includes('show') || lower.includes('where');

    const radiusMatch = lower.match(/(?:under|within|less than|max)\s+(\d+)\s*miles?/i)
      || lower.match(/(\d+)\s*mile\s+(?:radius|range)/i);
    if (radiusMatch) {
      params.radius = parseInt(radiusMatch[1]);
    }

    for (const [city, zip] of Object.entries(CITY_ZIPS)) {
      if (lower.includes(city) || lower.includes(city.replace(/(\w+)(\w)/, '$1 $2'))) {
        params.zip = zip;
        params.city = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    const explicitZip = lower.match(/\b(\d{5})\b/);
    if (explicitZip && !params.zip) {
      params.zip = explicitZip[1];
    }

    for (const [id, patterns] of VERTICAL_PATTERNS) {
      if (patterns.some(p => p.test(lower))) {
        params.vertical = id;
        break;
      }
    }

    const isDisposal = lower.includes('disposal') || lower.includes('dump') || lower.includes('tip')
      || lower.includes('transfer station') || lower.includes('recycling') || lower.includes('landfill');
    params.mode = isDisposal ? 'disposal' : 'labor';

    const volMatch = lower.match(/([\d,]+)\s*(?:gal|gallon)s?/);
    if (volMatch) {
      params.gallons = parseInt(volMatch[1].replace(/,/g, ''));
    }

    if (hasTranslate) {
      const langPatterns: [string, RegExp][] = [
        ['es', /spanish|español/],
        ['zh', /chinese|中文|mandarin/],
        ['vi', /vietnamese|tiếng việt/],
        ['en', /english/],
      ];
      for (const [code, pattern] of langPatterns) {
        if (pattern.test(lower)) {
          params.language = code;
          break;
        }
      }
      return { intent: 'translate', confidence: 0.9, params };
    }

    if (hasCompliance && !hasSearch) {
      return { intent: 'compliance', confidence: 0.85, params };
    }

    if (hasBid) {
      return { intent: 'bid', confidence: 0.85, params };
    }

    if (hasEquipment && !hasSearch) {
      return { intent: 'equipment', confidence: 0.85, params };
    }

    if (hasLogistics) {
      return { intent: 'logistics', confidence: 0.85, params };
    }

    if (hasSearch) {
      return { intent: 'search', confidence: 0.9, params };
    }

    return { intent: 'unknown', confidence: 0.1, params };
  }
}

export const intentRouter = new IntentRouter();
