import { NextRequest, NextResponse } from 'next/server';
import { IndexIntelligenceEngine } from '@/lib/market/adapter';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { Company } from '@/types/company';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.zip || !body.radius) {
      return NextResponse.json(
        { error: 'Missing core search parameters (zip or radius).' },
        { status: 400 }
      );
    }

    const clientHeader = req.headers.get('x-iie-client-context');
    if (!clientHeader) {
      return NextResponse.json(
        { error: 'X-IIE-Client-Context header is required for multi-tenant mapping.' },
        { status: 401 }
      );
    }

    const verticalConfig = await getVerticalConfigByDomain(clientHeader);
    if (!verticalConfig) {
      return NextResponse.json(
        { error: `Invalid or unregistered client configuration key: '${clientHeader}'` },
        { status: 403 }
      );
    }

    const engine = new IndexIntelligenceEngine();
    const { companies } = await engine.executeMarketDiscovery(body, verticalConfig);

    const segmentedCallsheet = companies.reduce(
      (acc, company) => {
        if (company.priority === 'A') {
          acc.priorityA.push(company);
        } else if (company.priority === 'B') {
          acc.priorityB.push(company);
        } else {
          acc.priorityC.push(company);
        }
        return acc;
      },
      {
        priorityA: [] as Company[],
        priorityB: [] as Company[],
        priorityC: [] as Company[]
      }
    );

    return NextResponse.json({
      success: true,
      tenant: verticalConfig.id,
      industry: verticalConfig.industryName,
      metrics: {
        totalFound: companies.length,
        priorityACount: segmentedCallsheet.priorityA.length,
        priorityBCount: segmentedCallsheet.priorityB.length,
        priorityCCount: segmentedCallsheet.priorityC.length,
      },
      callsheet: segmentedCallsheet
    });
  } catch (err: any) {
    console.error("Callsheet Generation Failure:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
