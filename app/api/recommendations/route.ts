import { NextRequest, NextResponse } from 'next/server';
import { recommendationEngine } from '@/lib/market/recommendation';
import { finalizeAuth } from '@/lib/auth/finalization';

// POST /api/recommendations
// Get workflow recommendations for a vertical.
//
// Body:
//   verticalId: string   — e.g. 'slurry_concrete'
//   workflow?:  string   — specific workflow question:
//                          'labor' | 'disposal' | 'equipment_rental' |
//                          'equipment_purchase' | 'bids' | 'compliance' | 'all'
//                          Defaults to 'all'.

export async function POST(req: NextRequest) {
  const auth = await finalizeAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { verticalId, workflow = 'all' } = body as {
    verticalId?: string;
    workflow?: string;
  };

  if (!verticalId) {
    return NextResponse.json({ error: 'verticalId is required' }, { status: 400 });
  }

  // Targeted single-workflow questions
  switch (workflow) {
    case 'labor':
      return NextResponse.json({
        verticalId,
        workflow: 'labor',
        items: recommendationEngine.getNeedLabor(verticalId),
      });

    case 'disposal':
      return NextResponse.json({
        verticalId,
        workflow: 'disposal',
        items: recommendationEngine.getNeedDisposal(verticalId),
      });

    case 'equipment_rental':
      return NextResponse.json({
        verticalId,
        workflow: 'equipment_rental',
        items: recommendationEngine.getNeedEquipmentRental(verticalId),
      });

    case 'equipment_purchase':
      return NextResponse.json({
        verticalId,
        workflow: 'equipment_purchase',
        items: recommendationEngine.getNeedEquipmentPurchase(verticalId),
      });

    case 'bids':
      return NextResponse.json({
        verticalId,
        workflow: 'bids',
        items: recommendationEngine.getNeedBidHelp(verticalId),
      });

    case 'compliance':
      return NextResponse.json({
        verticalId,
        workflow: 'compliance',
        items: recommendationEngine.getNeedComplianceGuidance(verticalId),
      });

    case 'cross_search':
      return NextResponse.json({
        verticalId,
        workflow: 'cross_search',
        items: recommendationEngine.getCrossSearchSuggestions(verticalId),
      });

    case 'all':
    default: {
      const recs = recommendationEngine.getWorkflowRecommendations(verticalId);
      if (!recs) {
        return NextResponse.json(
          { error: `Unknown vertical: ${verticalId}` },
          { status: 404 }
        );
      }
      return NextResponse.json(recs);
    }
  }
}
