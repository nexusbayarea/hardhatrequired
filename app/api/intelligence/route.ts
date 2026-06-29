import { NextRequest, NextResponse } from 'next/server';
import { getCachedFeed, setCachedFeed } from '@/lib/intelligence/cache';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';

interface Bid {
  id: string;
  title: string;
  agency: string;
  valueEstimate: string;
  deadline: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Complex';
  actionUrl: string;
}

interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
  impact: 'High' | 'Medium' | 'Low';
  actionableTakeaway: string;
}

interface ComplianceRule {
  id: string;
  title: string;
  authority: string;
  effectiveDate: string;
  penaltyRisk: string;
  summary: string;
  requiredAction: string;
}

interface Feed {
  bids: Bid[];
  news: NewsItem[];
  compliance: ComplianceRule[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const vertical = req.headers.get('x-iie-client-context') || 'slurry_concrete';
    const state = body.state || 'CA';
    const city = body.city || 'Hayward';

    const cachedBids = await getCachedFeed(vertical, state, 'bids');
    const cachedNews = await getCachedFeed(vertical, state, 'news');
    const cachedCompliance = await getCachedFeed(vertical, state, 'compliance');

    if (cachedBids && cachedNews && cachedCompliance) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        bids: cachedBids,
        news: cachedNews,
        compliance: cachedCompliance,
      });
    }

    const config = VERTICAL_REGISTRY[vertical];
    const feed = generateFeed(vertical, state, city, config);

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (DEEPSEEK_API_KEY) {
      const industryName = config?.industryName || vertical.replace(/_/g, ' ');
      const signalTerms = [
        ...(config?.signals?.primary?.map(s => s.term) || []),
        ...(config?.signals?.secondary?.map(s => s.term) || []),
      ].join(', ');
      const equipmentTerms = (config?.equipmentKeywords || []).join(', ');

      const systemPrompt = `You are a master regulatory and procurement intelligence engine for a local contractor.
Your task is to generate highly realistic, actionable, and localized intelligence items for the daily newsfeed of a contractor operating in the "${industryName}" vertical.

Industry context:
- Key signal terms: ${signalTerms || 'N/A'}
- Specialized equipment: ${equipmentTerms || 'N/A'}

Generate data specific to Vertical: "${vertical}", State: "${state}", City/County Area: "${city}".
Generate items that a local contractor in this specific industry would actually see, bid on, or need to comply with.

You must return a valid JSON object matching this schema:
{
  "bids": [6 items],
  "news": [5 items],
  "compliance": [4 items]
}

Each bid: { id, title, agency, valueEstimate, deadline, description, difficulty: "Easy"|"Medium"|"Complex", actionUrl: "#" }
Each news: { id, title, source, publishedAt, summary, impact: "High"|"Medium"|"Low", actionableTakeaway }
Each compliance: { id, title, authority, effectiveDate, penaltyRisk, summary, requiredAction }
Return exactly 6 bids, 5 news, and 4 compliance items. No markdown, no wrappers — pure JSON object.`;

      const userPrompt = `Generate the daily intelligence feed for vertical "${vertical}" (${industryName}) in ${city}, ${state}. Include 6 municipal/commercial bids, 5 industry news items, and 4 compliance/regulatory updates. Each item must be highly realistic and specific to this industry.`;

      fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 4000,
        }),
        signal: AbortSignal.timeout(15000),
      })
        .then(res => res.json())
        .then(async raw => {
          const aiFeed = JSON.parse(raw.choices[0].message.content);
          if (!aiFeed || !aiFeed.bids) return;
          await Promise.all([
            setCachedFeed(vertical, state, 'bids', aiFeed.bids),
            setCachedFeed(vertical, state, 'news', aiFeed.news),
            setCachedFeed(vertical, state, 'compliance', aiFeed.compliance),
          ]);
          console.log('[Intelligence] DeepSeek enrichment cached');
        })
        .catch(err => console.warn('[Intelligence] DeepSeek enrichment failed:', err));
    }

    return NextResponse.json({ success: true, source: 'default', ...feed });
  } catch (error: any) {
    console.error('[Daily Intelligence Route] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function generateFeed(vertical: string, state: string, city: string, config?: any): Feed {
  const industry = config?.industryName || vertical.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const primary = (config?.signals?.primary || []).map((s: any) => s.term);
  const secondary = (config?.signals?.secondary || []).map((s: any) => s.term);
  const equipment = config?.equipmentKeywords || [];

  const allTerms = [...new Set([...primary, ...secondary])].filter(Boolean) as string[];
  const kw = (i: number) => allTerms[i % (allTerms.length || 1)] || 'specialized';
  const eq = (i: number) => equipment[i % (equipment.length || 1)] || 'specialized equipment';

  const agencies = [
    `${city} Department of Public Works`,
    `${state} Environmental Protection Agency`,
    `${city} Municipal Utilities Authority`,
    `${city} Planning & Development Commission`,
    `${state} Department of Environmental Quality`,
    `${state} Division of Procurement Services`,
  ];

  const deadlineDates = ['2026-07-15', '2026-07-28', '2026-08-10', '2026-08-22', '2026-09-05', '2026-09-18'];
  const valueEstimates = [
    '$45,000 - $75,000',
    '$120,000 Recurring',
    '$85,000 - $150,000',
    '$60,000 Annual Contract',
    '$200,000 - $350,000',
    '$95,000 Fixed Price',
  ];
  const difficulties: ('Easy' | 'Medium' | 'Complex')[] = ['Easy', 'Medium', 'Complex', 'Medium', 'Complex', 'Easy'];

  const bidTitles = [
    (i: number) => `Municipal ${kw(i)} Services Contract`,
    (i: number) => `Commercial ${kw(i)} Processing & Disposal RFP`,
    (i: number) => `${eq(i)} Maintenance & Certification Program`,
    (i: number) => `${city} ${kw(i)} Collection Contract`,
    (i: number) => `Statewide ${kw(i)} Management Services`,
    (i: number) => `Industrial ${eq(i)} Procurement & Installation`,
  ];

  const bidDescs = [
    (i: number) =>
      `Annual contract for ${kw(i).toLowerCase()} collection, processing, and disposal services across city facilities and municipal construction projects. Contractor must provide all specialized equipment and trained personnel.`,
    (i: number) =>
      `RFP for commercial ${kw(i).toLowerCase()} processing services including transportation, treatment, and certified disposal. Estimated volume of 500+ tons annually.`,
    (i: number) =>
      `Preventive maintenance and certification program for ${eq(i).toLowerCase()} equipment across county facilities. Includes annual inspection, calibration, and emergency repair services.`,
    (i: number) =>
      `Exclusive contract for ${kw(i).toLowerCase()} collection services within ${city} commercial districts. Includes route optimization, container maintenance, and monthly reporting.`,
    (i: number) =>
      `State-managed ${kw(i).toLowerCase()} services contract covering ${city} and surrounding counties. Multi-award IDIQ structure with 3-year base term.`,
    (i: number) =>
      `Design-build procurement and installation of ${eq(i).toLowerCase()} systems at ${city} municipal facilities. Includes training, warranty, and ongoing support.`,
  ];

  const bids: Bid[] = Array.from({ length: 6 }, (_, i) => ({
    id: `bid-${1100 + i}`,
    title: bidTitles[i](i),
    agency: agencies[i % agencies.length],
    valueEstimate: valueEstimates[i],
    deadline: deadlineDates[i],
    description: bidDescs[i](i),
    difficulty: difficulties[i],
    actionUrl: '#',
  }));

  const sources = [
    `${industry} Association`,
    `${state} Business Journal`,
    `National ${industry} Review`,
    `Industrial Services Magazine`,
    `${state} Regulatory Digest`,
  ];

  const newsItems: NewsItem[] = [
    {
      id: 'news-41',
      title: `${kw(0)} Processing Costs Projected to Spike 12% in Q3`,
      source: sources[0],
      publishedAt: '8 hours ago',
      summary: `Regional landfill consolidations and stricter ${state} water quality limits are forcing third-party disposal operators to raise gate fees for ${kw(0).toLowerCase()} processing starting next month.`,
      impact: 'High',
      actionableTakeaway: `Adjust out-of-county quote pricing on prospective ${kw(0).toLowerCase()} bids to preserve service operating margins.`,
    },
    {
      id: 'news-42',
      title: `New ${state} Regulations Impact ${industry} Operations`,
      source: sources[1],
      publishedAt: '1 day ago',
      summary: `The ${state} legislature has introduced new compliance requirements for ${kw(1).toLowerCase()} handling that will take effect next quarter, affecting all licensed contractors in the state.`,
      impact: 'Medium',
      actionableTakeaway: `Review updated ${state} code requirements and adjust operational procedures before enforcement deadlines.`,
    },
    {
      id: 'news-43',
      title: `${eq(2)} Technology Advancements Drive Efficiency Gains`,
      source: sources[2],
      publishedAt: '2 days ago',
      summary: `New ${eq(2).toLowerCase()} systems are delivering 30% faster processing times and reduced water consumption, helping contractors meet stricter environmental standards while cutting costs.`,
      impact: 'High',
      actionableTakeaway: `Evaluate ${eq(2).toLowerCase()} upgrades for fleet modernization to capture competitive advantage on upcoming bids.`,
    },
    {
      id: 'news-44',
      title: `${industry} Market Demand Grows 15% Year-Over-Year`,
      source: sources[3],
      publishedAt: '4 days ago',
      summary: `${kw(3)} service demand continues to climb as commercial construction activity in ${city} and surrounding areas shows sustained growth through Q2.`,
      impact: 'Low',
      actionableTakeaway: `Increase outbound sales efforts targeting new commercial construction projects in the ${city} area.`,
    },
    {
      id: 'news-45',
      title: `${state} Launches ${kw(4)} Certification Program`,
      source: sources[4],
      publishedAt: '6 days ago',
      summary: `The ${state} environmental agency has launched a voluntary certification program for ${kw(4).toLowerCase()} contractors, offering expedited permitting and reduced inspection frequency.`,
      impact: 'Medium',
      actionableTakeaway: `Apply for ${kw(4).toLowerCase()} certification to gain preferential treatment in state procurement evaluations.`,
    },
  ];

  const authorities = [
    `${state} Water Resources Control Board`,
    `${state} Division of Occupational Safety`,
    `EPA Region 9`,
    `${city} Municipal Code Enforcement`,
  ];

  const complianceRules: ComplianceRule[] = [
    {
      id: 'comp-501',
      title: `${kw(0)} Handling & Disposal Requirements - ${state} Code Section ${4100 + (vertical.length * 7) % 100}`,
      authority: authorities[0],
      effectiveDate: '2026-08-01',
      penaltyRisk: '$25,000 Per-day Non-Compliance Fines',
      summary: `Mandates that ${kw(0).toLowerCase()} materials must be processed through certified treatment facilities with documented chain-of-custody tracking. New filtration standards require particulate levels below 100 NTU.`,
      requiredAction: `Verify current ${kw(0).toLowerCase()} disposal contracts meet new filtration standards and obtain updated certification from treatment facilities.`,
    },
    {
      id: 'comp-502',
      title: `${eq(1)} Safety Certification Requirements Update`,
      authority: authorities[1],
      effectiveDate: '2026-09-15',
      penaltyRisk: '$15,000 Per Violation',
      summary: `Updated safety certification requirements for ${eq(1).toLowerCase()} operators include annual refresher training and equipment-specific competency verification.`,
      requiredAction: `Schedule ${eq(1).toLowerCase()} operator training sessions and update safety documentation before the September deadline.`,
    },
    {
      id: 'comp-503',
      title: `EPA ${kw(2)} Discharge Limitations - Final Rule`,
      authority: authorities[2],
      effectiveDate: '2026-10-01',
      penaltyRisk: '$37,500 Per Day EPA Penalties',
      summary: `New EPA effluent limitations for ${kw(2).toLowerCase()} discharges establish stricter pollutant concentration limits and require quarterly compliance reporting.`,
      requiredAction: `Implement enhanced ${kw(2).toLowerCase()} treatment protocols and establish quarterly sampling and reporting procedures.`,
    },
    {
      id: 'comp-504',
      title: `${city} ${kw(3)} Operations Ordinance ${5100 + (vertical.length * 13) % 100}`,
      authority: authorities[3],
      effectiveDate: '2026-07-01',
      penaltyRisk: '$10,000 + License Suspension',
      summary: `${city} municipal code update requires all ${kw(3).toLowerCase()} contractors to obtain a city operating permit and maintain minimum liability insurance of $2 million.`,
      requiredAction: `Apply for ${city} operating permit and verify insurance coverage meets new minimum requirements.`,
    },
  ];

  return { bids, news: newsItems, compliance: complianceRules };
}
