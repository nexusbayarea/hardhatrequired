import { NextRequest, NextResponse } from 'next/server';
import { feedbackEngine, FeedbackType } from '@/lib/market/feedback';
import { finalizeAuth } from '@/lib/auth/finalization';

// POST /api/feedback
// Submit a feedback signal for a search result.
//
// Body:
//   companyId:    string      — ID of the company result
//   verticalId:   string      — which vertical the search was in
//   feedbackType: FeedbackType — 'accurate' | 'incorrect' | 'trusted_vendor' | 'bad_data'
//   note?:        string      — optional free-text note
//   resultIndex?: string      — which HHR index ('labor', 'disposal', etc.)
//   searchId?:    string      — the saved search that surfaced this result

const VALID_TYPES: FeedbackType[] = ['accurate', 'incorrect', 'trusted_vendor', 'bad_data'];

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

  const { companyId, verticalId, feedbackType, note, resultIndex, searchId } = body as {
    companyId?: string;
    verticalId?: string;
    feedbackType?: string;
    note?: string;
    resultIndex?: string;
    searchId?: string;
  };

  if (!companyId || !verticalId || !feedbackType) {
    return NextResponse.json(
      { error: 'companyId, verticalId, and feedbackType are required' },
      { status: 400 }
    );
  }

  if (!VALID_TYPES.includes(feedbackType as FeedbackType)) {
    return NextResponse.json(
      { error: `feedbackType must be one of: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const result = await feedbackEngine.submitFeedback({
    organizationId: auth.ctx.orgId,
    userId: auth.ctx.userId,
    companyId,
    verticalId,
    feedbackType: feedbackType as FeedbackType,
    note,
    resultIndex,
    searchId,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// GET /api/feedback?verticalId=slurry_concrete
// Returns aggregate feedback stats for a vertical within the org.

export async function GET(req: NextRequest) {
  const auth = await finalizeAuth(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const verticalId = req.nextUrl.searchParams.get('verticalId');
  if (!verticalId) {
    return NextResponse.json({ error: 'verticalId is required' }, { status: 400 });
  }

  const stats = await feedbackEngine.getVerticalFeedbackStats(
    verticalId,
    auth.ctx.orgId
  );

  return NextResponse.json(stats);
}
