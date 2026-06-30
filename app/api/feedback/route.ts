import { NextRequest, NextResponse } from 'next/server';
import { VoteType } from '@/types/feedback';
import { saveVote, upsertCompanyProfile, getCompanyProfile, getVerticalStats } from '@/lib/feedback/storage';
import { computeTrustFactors, calculateWeightedImpact, getFeedbackAdjustment } from '@/lib/feedback/trust';
import { FEEDBACK_WEIGHTS } from '@/types/feedback';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, companyName, vertical, voteType, leadScore, signals } = body;

    if (!companyId || !vertical || !voteType) {
      return NextResponse.json(
        { success: false, error: 'companyId, vertical, and voteType are required' },
        { status: 400 }
      );
    }

    if (!['accurate', 'bad'].includes(voteType)) {
      return NextResponse.json(
        { success: false, error: 'voteType must be accurate or bad' },
        { status: 400 }
      );
    }

    const existingProfile = await getCompanyProfile(companyId, vertical);

    const factors = computeTrustFactors({
      companyVoteCount: existingProfile?.totalVotes ?? 0,
      daysSinceLastVote: existingProfile?.lastVoteAt
        ? Math.floor(
            (Date.now() - new Date(existingProfile.lastVoteAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : undefined,
    });

    const voteValue = FEEDBACK_WEIGHTS.voteValue[voteType as VoteType];
    const weightedImpact = calculateWeightedImpact(voteValue, factors);

    await saveVote({
      companyId,
      companyName: companyName || '',
      vertical,
      voteType: voteType as VoteType,
      userTrust: factors.userTrust,
      verticalTrust: factors.verticalTrust,
      consensusWeight: factors.consensusWeight,
      timeDecay: factors.timeDecay,
      weightedImpact,
      leadScore: leadScore ?? undefined,
      signals: signals ?? undefined,
    });

    const updatedProfile = await upsertCompanyProfile(
      companyId,
      vertical,
      voteType as VoteType,
      weightedImpact,
      existingProfile
    );

    const adjustment = updatedProfile
      ? getFeedbackAdjustment({
          totalVotes: updatedProfile.totalVotes,
          badVotes: updatedProfile.badVotes,
          feedbackScore: updatedProfile.feedbackScore,
        })
      : { adjustment: 0, action: 'none' };

    return NextResponse.json({
      success: true,
      weightedImpact,
      factors,
      feedbackProfile: updatedProfile
        ? {
            feedbackScore: updatedProfile.feedbackScore,
            feedbackConfidence: updatedProfile.feedbackConfidence,
            totalVotes: updatedProfile.totalVotes,
          }
        : null,
      scoreAdjustment: adjustment,
    });
  } catch (err: any) {
    console.error('Feedback POST Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vertical = searchParams.get('vertical') || undefined;

    const stats = await getVerticalStats(vertical);

    return NextResponse.json({ success: true, ...stats });
  } catch (err: any) {
    console.error('Feedback GET Error:', err);
    return NextResponse.json(
      { success: true, total: 0, accurate: 0, bad: 0, rate: 0 },
      { status: 200 }
    );
  }
}
