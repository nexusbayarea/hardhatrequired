import { NextRequest, NextResponse } from 'next/server';
import { IndexIntelligenceEngine } from '@/lib/market/adapter';
import { VERTICAL_REGISTRY, getVerticalConfigByDomain } from '@/lib/market/registry';
import { generateMarketReport } from '@/lib/market/reports';

export async function POST(req: NextRequest) {
  try {
    const { name, filters } = await req.json();

    const clientOrigin = req.headers.get('x-iie-client-context');
    let verticalConfig;

    if (clientOrigin) {
      verticalConfig = await getVerticalConfigByDomain(clientOrigin);
      if (!verticalConfig) {
        return NextResponse.json({ error: "Unauthorized or invalid wrapper origin configuration profile." }, { status: 403 });
      }
    } else {
      const firstKey = Object.keys(VERTICAL_REGISTRY)[0];
      verticalConfig = VERTICAL_REGISTRY[firstKey];
    }

    const searchFilters = filters || { zip: '94538', radius: 50, mode: 'labor', vertical: verticalConfig.id };

    const engine = new IndexIntelligenceEngine();
    const { companies } = await engine.executeMarketDiscovery(searchFilters, verticalConfig);
    const report = generateMarketReport(name || `${verticalConfig.industryName} Market Report`, companies);

    return NextResponse.json({
      ...report,
      vertical: verticalConfig.id,
      industryName: verticalConfig.industryName
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
