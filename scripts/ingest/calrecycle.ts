import axios from 'axios';
import papa from 'papaparse';
import fs from 'fs';
import path from 'path';
import { classifyFacility } from '../../lib/regulatory/classifiers';
import { RegulatoryFacility, SwisSite, SwisActivity, SwisWaste, SwisOperator } from '../../lib/regulatory/types';

const EXPORT_BASE = 'https://www2.calrecycle.ca.gov/SolidWaste/Site';
const EXPORTS: { name: string; endpoint: string }[] = [
  { name: 'sites', endpoint: 'SitesExports' },
  { name: 'activities', endpoint: 'SiteActivityExports' },
  { name: 'waste', endpoint: 'SiteWasteExports' },
  { name: 'operators', endpoint: 'SiteOperatorsExports' },
];

function decodeCsv(buffer: Buffer): string {
  const decoder = new TextDecoder('utf-16le');
  return decoder.decode(buffer);
}

async function downloadAndParse<T>(endpoint: string): Promise<T[]> {
  const url = `${EXPORT_BASE}/${endpoint}?format=2`;
  console.log(`  Downloading ${url}...`);
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  const text = decodeCsv(Buffer.from(response.data));
  const parsed = papa.parse<T>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    console.warn(`  Parse warnings: ${parsed.errors.length}`);
  }
  console.log(`  Parsed ${parsed.data.length} rows`);
  return parsed.data;
}

function normalizeSite(row: Record<string, string>): SwisSite {
  return {
    swisNumber: row['SWIS Number']?.trim() || '',
    name: row['Name']?.trim() || '',
    latitude: row['Latitude']?.trim() || '',
    longitude: row['Longitude']?.trim() || '',
    streetAddress: row['Street Address']?.trim() || '',
    city: row['City']?.trim() || '',
    state: row['State']?.trim() || 'CA',
    zipCode: row['ZIP Code']?.trim() || '',
    county: row['County']?.trim() || '',
    siteOperationalStatus: row['Site Operational Status']?.trim() || '',
    siteRegulatoryStatus: row['Site Regulatory Status']?.trim() || '',
    isInertDebris: row['IsSiteInertDebrisEngineeredFill']?.trim() || '',
    reportingAgency: row['Reporting Agency Legal Name']?.trim() || '',
  };
}

function normalizeActivity(row: Record<string, string>): SwisActivity {
  return {
    swisNumber: row['SWIS Number']?.trim() || '',
    siteName: row['Site Name']?.trim() || '',
    activity: row['Activity']?.trim() || '',
    activityCategory: row['Activity Category']?.trim() || '',
    activityClassification: row['Activity Classification']?.trim() || '',
  };
}

function normalizeWaste(row: Record<string, string>): SwisWaste {
  return {
    swisNumber: row['SWIS Number']?.trim() || '',
    siteName: row['Site Name']?.trim() || '',
    activity: row['Activity']?.trim() || '',
    wasteType: row['Waste Type']?.trim() || '',
  };
}

function normalizeOperator(row: Record<string, string>): SwisOperator {
  return {
    swisNumber: row['SWIS Number']?.trim() || '',
    siteName: row['Site Name']?.trim() || '',
    operatorName: row['Operator Name']?.trim() || '',
    operatorPhone: row['Operator Phone']?.trim() || '',
    operatorStreetAddress: row['Operator Street Address']?.trim() || '',
    operatorCity: row['Operator City']?.trim() || '',
    operatorState: row['Operator State']?.trim() || '',
    operatorZip: row['Operator ZIP Code']?.trim() || '',
  };
}

async function ingest() {
  console.log('CalRecycle SWIS Ingestion');
  console.log('========================\n');

  const start = Date.now();

  // 1. Download all 4 exports
  console.log('Step 1: Downloading exports...');
  const [sitesRaw, activitiesRaw, wasteRaw, operatorsRaw] = await Promise.all(
    EXPORTS.map(e => downloadAndParse<Record<string, string>>(e.endpoint)),
  );

  const sites = sitesRaw.map(normalizeSite);
  const activities = activitiesRaw.map(normalizeActivity);
  const waste = wasteRaw.map(normalizeWaste);
  const operators = operatorsRaw.map(normalizeOperator);

  console.log(`\n  Sites: ${sites.length}`);
  console.log(`  Activities: ${activities.length}`);
  console.log(`  Waste Types: ${waste.length}`);
  console.log(`  Operators: ${operators.length}\n`);

  // 2. Build lookup maps
  const wasteBySite = new Map<string, string[]>();
  for (const w of waste) {
    if (!wasteBySite.has(w.swisNumber)) wasteBySite.set(w.swisNumber, []);
    wasteBySite.get(w.swisNumber)!.push(w.wasteType);
  }

  const activitiesBySite = new Map<string, string[]>();
  for (const a of activities) {
    if (!activitiesBySite.has(a.swisNumber)) activitiesBySite.set(a.swisNumber, []);
    activitiesBySite.get(a.swisNumber)!.push(a.activity);
  }

  const operatorsBySite = new Map<string, SwisOperator[]>();
  for (const o of operators) {
    if (!operatorsBySite.has(o.swisNumber)) operatorsBySite.set(o.swisNumber, []);
    operatorsBySite.get(o.swisNumber)!.push(o);
  }

  // 3. Classify every site into HHR verticals
  console.log('Step 2: Classifying facilities into HHR verticals...');
  const classified: RegulatoryFacility[] = [];
  const unclassified: { name: string; city: string; county: string; wasteTypes: string[]; activities: string[] }[] = [];

  for (const site of sites) {
    if (!site.swisNumber) continue;

    const siteWaste = wasteBySite.get(site.swisNumber) || [];
    const siteActivities = activitiesBySite.get(site.swisNumber) || [];
    const siteOperators = operatorsBySite.get(site.swisNumber) || [];

    const matches = classifyFacility(site.name, siteWaste, siteActivities);

    for (const match of matches) {
      classified.push({
        id: `calrecycle-${site.swisNumber}-${match.vertical}`,
        swisNumber: site.swisNumber,
        facilityName: site.name,
        operatorName: siteOperators.map(o => o.operatorName).filter(Boolean).join('; '),
        streetAddress: site.streetAddress,
        city: site.city,
        state: site.state,
        zip: site.zipCode,
        county: site.county,
        latitude: site.latitude ? parseFloat(site.latitude) : undefined,
        longitude: site.longitude ? parseFloat(site.longitude) : undefined,
        permitStatus: site.siteRegulatoryStatus,
        regulatoryStatus: site.siteOperationalStatus,
        activities: siteActivities,
        wasteTypes: siteWaste,
        vertical: match.vertical,
        confidence: match.confidence,
        source: 'calrecycle_export',
        importedAt: new Date().toISOString(),
      });
    }

    if (matches.length === 0 && siteWaste.length > 0) {
      unclassified.push({ name: site.name, city: site.city, county: site.county, wasteTypes: siteWaste, activities: siteActivities });
    }
  }

  console.log(`  Classified: ${classified.length} facilities across ${new Set(classified.map(c => c.vertical)).size} verticals\n`);

  // 4. Group by vertical
  const byVertical = new Map<string, RegulatoryFacility[]>();
  for (const f of classified) {
    if (!byVertical.has(f.vertical)) byVertical.set(f.vertical, []);
    byVertical.get(f.vertical)!.push(f);
  }

  for (const [v, facilities] of byVertical) {
    console.log(`  ${v}: ${facilities.length}`);
  }

  // 5. Clean stale files and write output
  const outputDir = path.join(process.cwd(), 'data', 'regulatory');
  fs.mkdirSync(outputDir, { recursive: true });

  // Remove previous per-vertical files
  const existingFiles = fs.readdirSync(outputDir).filter(f => f.startsWith('calrecycle_') && f.endsWith('.json'));
  for (const f of existingFiles) {
    if (f === 'calrecycle_stats.json' || f === 'calrecycle_unclassified.json') continue;
    fs.unlinkSync(path.join(outputDir, f));
  }

  // Full dump
  fs.writeFileSync(
    path.join(outputDir, 'calrecycle_all.json'),
    JSON.stringify({ importedAt: new Date().toISOString(), sites: classified.length, facilities: classified }, null, 2),
  );

  // Per-vertical files
  for (const [v, facilities] of byVertical) {
    fs.writeFileSync(
      path.join(outputDir, `calrecycle_${v}.json`),
      JSON.stringify(facilities, null, 2),
    );
  }

  // Stats
  const stats = {
    importedAt: new Date().toISOString(),
    sources: {
      sites: sites.length,
      activities: activities.length,
      waste: waste.length,
      operators: operators.length,
    },
    classified: classified.length,
    unclassified: unclassified.length,
    verticals: Object.fromEntries(
      Array.from(byVertical.entries()).map(([v, f]) => [v, f.length]),
    ),
  };
  fs.writeFileSync(
    path.join(outputDir, 'calrecycle_stats.json'),
    JSON.stringify(stats, null, 2),
  );

  // Unclassified sample (for classifier improvement)
  fs.writeFileSync(
    path.join(outputDir, 'calrecycle_unclassified.json'),
    JSON.stringify({ importedAt: new Date().toISOString(), count: unclassified.length, samples: unclassified.slice(0, 500) }, null, 2),
  );

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s. Output: ${outputDir}`);
  console.log(`  ${classified.length} classified facilities across ${byVertical.size} verticals`);
  console.log(`  ${unclassified.length} unclassified facilities (with waste data but no vertical match)`);
}

ingest().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
