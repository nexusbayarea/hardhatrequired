import { NextRequest, NextResponse } from 'next/server';
import { IndexIntelligenceEngine } from '@/lib/market/adapter';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { generateMarketReport } from '@/lib/market/reports';

export async function POST(req: NextRequest) {
  try {
    const { name, filters, sample } = await req.json();

    if (sample) {
      return NextResponse.json({
        name: "Bay Area Concrete Recycling",
        searchDate: new Date().toISOString().split('T')[0],
        totalCompanies: 43,
        priorityA: 12,
        priorityB: 15,
        priorityC: 16,
        coverage: {
          phone: 95,
          website: 90,
          email: 42
        }
      });
    }

    if (!filters?.zip) {
      return NextResponse.json({ error: 'Search filters with zip required for report generation.' }, { status: 400 });
    }

    const clientOrigin = req.headers.get('x-iie-client-context');
    if (!clientOrigin) {
      return NextResponse.json(
        { error: 'X-IIE-Client-Context header is required for report generation.' },
        { status: 401 }
      );
    }

    const verticalConfig = await getVerticalConfigByDomain(clientOrigin);
    if (!verticalConfig) {
      return NextResponse.json({ error: "Unauthorized or invalid wrapper origin configuration profile." }, { status: 403 });
    }

    const engine = new IndexIntelligenceEngine();
    const { companies } = await engine.executeMarketDiscovery(filters, verticalConfig);
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
