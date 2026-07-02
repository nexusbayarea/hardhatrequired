export interface ClassifierResult {
  vertical: string | null;
  confidence: 'high' | 'medium' | 'low';
}

const VERTICAL_PATTERNS: Record<string, { name: RegExp[]; waste: RegExp[]; requireWaste: boolean }> = {
  slurry_processing: {
    name: [/slurry/i, /concrete\s*(washout|recycl|reclaim)/i, /washout\s*yard/i, /concrete\s*fines/i],
    waste: [/concrete\s*slurry/i, /concrete\s*fines/i, /cementitious/i],
    requireWaste: true,
  },
  asbestos_abatement: {
    name: [/asbestos/i, /abatement/i],
    waste: [/asbestos/i],
    requireWaste: false,
  },
  grease_trap: {
    name: [/grease/i, /rendering/i, /cooking\s*oil/i, /trap\s*(service|clean)/i],
    waste: [/grease/i, /fats?\s*oil/i, /fog/i, /cooking\s*oil/i, /interceptor/i, /yellow\s*grease/i],
    requireWaste: true,
  },
  industrial_wastewater: {
    name: [/wastewater/i, /water\s*(treatment|recycl)/i, /industrial\s*waste/i, /liquid\s*waste/i],
    waste: [/wastewater/i, /industrial\s*(waste|sludge)/i, /sludge.*(bio|solid)/i, /liquid\s*waste/i, /process\s*water/i, /^\s*ash\s*$/i],
    requireWaste: true,
  },
  medical_waste: {
    name: [/medical\s*waste/i, /bio.?hazard/i, /infectious/i, /sharps/i, /regulated\s*medical/i, /dead\s*animal/i],
    waste: [/medical/i, /bio.?hazard/i, /infectious/i, /sharps/i, /pathological/i, /dead\s*animal/i],
    requireWaste: true,
  },
  scrap_metal: {
    name: [/scrap\s*metal/i, /metal\s*recycl/i, /junkyard/i, /salvage/i, /auto\s*wreck/i, /metals\s*recycl/i],
    waste: [/scrap\s*metal/i, /ferrous/i, /non.?ferrous/i, /^\s*metals\s*$/i, /^\s*tires?\s*$/i],
    requireWaste: true,
  },
  stormwater_compliance: {
    name: [/stormwater/i, /swppp/i, /water\s*quality/i],
    waste: [],
    requireWaste: false,
  },
  tank_testing: {
    name: [/tank\s*(test|clean|inspect|remov)/i, /ust/i, /fuel\s*tank/i, /underground\s*storage/i],
    waste: [/petroleum/i, /fuel/i, /gasoline/i, /diesel/i, /used\s*oil/i],
    requireWaste: true,
  },
  hydro_excavation: {
    name: [/hydro.?vac/i, /hydro.?excavat/i, /vacuum\s*truck/i, /non.?destructive/i],
    waste: [],
    requireWaste: false,
  },
  hazardous_soil_remediation: {
    name: [/haz(ardo)?\s*(soil|waste|mat)/i, /remediation/i, /superfund/i, /brownfield/i, /contaminated\s*soil/i],
    waste: [/hazardous/i, /contaminated\s*soil/i, /toxic/i, /chemical/i, /other\s*hazardous/i],
    requireWaste: true,
  },
};

export function classifyFacility(
  name: string,
  wasteTypes: string[],
  _activities: string[],
): ClassifierResult[] {
  const results: ClassifierResult[] = [];

  for (const [vertical, patterns] of Object.entries(VERTICAL_PATTERNS)) {
    const nameMatch = patterns.name.some(re => re.test(name));
    const wasteMatch = patterns.waste.length === 0 || patterns.waste.some(re => wasteTypes.some(w => re.test(w.trim())));
    const hasWastePatterns = patterns.waste.length > 0;

    if (!nameMatch) continue;

    if (hasWastePatterns && patterns.requireWaste && !wasteMatch) continue;

    const score = (nameMatch ? 3 : 0) + (wasteMatch ? 2 : 0);

    results.push({
      vertical,
      confidence: score >= 4 || !hasWastePatterns ? 'high' : 'medium',
    });
  }

  return results;
}
