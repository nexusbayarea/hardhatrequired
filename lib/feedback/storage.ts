import { createClient } from '@supabase/supabase-js';
import {
  FeedbackVote,
  CompanyFeedbackProfile,
  FeedbackVoteSummary,
  VoteType,
} from '@/types/feedback';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
}

export async function saveVote(params: {
  companyId: string;
  companyName: string;
  vertical: string;
  voteType: VoteType;
  userTrust: number;
  verticalTrust: number;
  consensusWeight: number;
  timeDecay: number;
  weightedImpact: number;
  leadScore?: number;
  signals?: string;
}): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  const { error } = await client.from('feedback_votes').insert({
    company_id: params.companyId,
    company_name: params.companyName,
    vertical: params.vertical,
    vote_type: params.voteType,
    user_trust: params.userTrust,
    vertical_trust: params.verticalTrust,
    consensus_weight: params.consensusWeight,
    time_decay: params.timeDecay,
    weighted_impact: params.weightedImpact,
    lead_score: params.leadScore ?? null,
    signals: params.signals ?? null,
  });

  return !error;
}

export async function getCompanyProfile(
  companyId: string,
  vertical: string
): Promise<CompanyFeedbackProfile | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from('company_feedback_profiles')
    .select('*')
    .eq('company_id', companyId)
    .eq('vertical', vertical)
    .single();

  if (error || !data) return null;

  return mapRowToProfile(data);
}

export async function upsertCompanyProfile(
  companyId: string,
  vertical: string,
  voteType: VoteType,
  weightedImpact: number,
  existingProfile?: CompanyFeedbackProfile | null
): Promise<CompanyFeedbackProfile | null> {
  const client = getClient();
  if (!client) return null;

  const profile = existingProfile ?? (await getCompanyProfile(companyId, vertical));

  const now = new Date().toISOString();
  const newVote: FeedbackVoteSummary = {
    voteType,
    weightedImpact,
    createdAt: now,
  };

  if (profile) {
    const updatedHistory = [...(profile.voteHistory || []), newVote];
    const totalVotes = profile.totalVotes + 1;
    const accurateVotes = profile.accurateVotes + (voteType === 'accurate' ? 1 : 0);
    const partialVotes = profile.partialVotes + (voteType === 'partial' ? 1 : 0);
    const badVotes = profile.badVotes + (voteType === 'bad' ? 1 : 0);
    const score = computeFeedbackScore(updatedHistory);
    const confidence = computeConfidence(totalVotes, updatedHistory);

    const { error } = await client
      .from('company_feedback_profiles')
      .update({
        feedback_score: score,
        feedback_confidence: confidence,
        total_votes: totalVotes,
        accurate_votes: accurateVotes,
        partial_votes: partialVotes,
        bad_votes: badVotes,
        vote_history: JSON.stringify(updatedHistory),
        last_vote_at: now,
        updated_at: now,
      })
      .eq('company_id', companyId)
      .eq('vertical', vertical);

    if (error) return null;

    return {
      companyId,
      vertical,
      feedbackScore: score,
      feedbackConfidence: confidence,
      totalVotes,
      accurateVotes,
      partialVotes,
      badVotes,
      voteHistory: updatedHistory,
      lastVoteAt: now,
      updatedAt: now,
    };
  }

  const history = [newVote];
  const score = computeFeedbackScore(history);
  const confidence = computeConfidence(1, history);

  const { error } = await client.from('company_feedback_profiles').insert({
    company_id: companyId,
    vertical,
    feedback_score: score,
    feedback_confidence: confidence,
    total_votes: 1,
    accurate_votes: voteType === 'accurate' ? 1 : 0,
    partial_votes: voteType === 'partial' ? 1 : 0,
    bad_votes: voteType === 'bad' ? 1 : 0,
    vote_history: JSON.stringify(history),
    last_vote_at: now,
    updated_at: now,
  });

  if (error) return null;

  return {
    companyId,
    vertical,
    feedbackScore: score,
    feedbackConfidence: confidence,
    totalVotes: 1,
    accurateVotes: voteType === 'accurate' ? 1 : 0,
    partialVotes: voteType === 'partial' ? 1 : 0,
    badVotes: voteType === 'bad' ? 1 : 0,
    voteHistory: history,
    lastVoteAt: now,
    updatedAt: now,
  };
}

export async function getVerticalStats(vertical?: string): Promise<{
  total: number;
  accurate: number;
  partial: number;
  bad: number;
  rate: number;
}> {
  const client = getClient();
  if (!client) {
    return { total: 0, accurate: 0, partial: 0, bad: 0, rate: 0 };
  }

  let query = client.from('feedback_votes').select('vote_type');
  if (vertical) {
    query = query.eq('vertical', vertical);
  }

  const { data, error } = await query;
  if (error || !data) {
    return { total: 0, accurate: 0, partial: 0, bad: 0, rate: 0 };
  }

  const total = data.length;
  const accurate = data.filter((r: any) => r.vote_type === 'accurate').length;
  const partial = data.filter((r: any) => r.vote_type === 'partial').length;
  const bad = data.filter((r: any) => r.vote_type === 'bad').length;

  return {
    total,
    accurate,
    partial,
    bad,
    rate: total > 0 ? Math.round((accurate / total) * 100) : 0,
  };
}

export async function getRecentVotes(
  companyId: string,
  vertical: string,
  limit: number = 50
): Promise<FeedbackVote[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('feedback_votes')
    .select('*')
    .eq('company_id', companyId)
    .eq('vertical', vertical)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map(mapVoteRow);
}

export async function getBlacklistedVerticalCompanies(
  vertical: string
): Promise<string[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from('company_feedback_profiles')
    .select('company_id')
    .eq('vertical', vertical)
    .lt('feedback_score', -50)
    .gte('total_votes', 15);

  if (error || !data) return [];

  return data.map((r: any) => r.company_id);
}

function computeFeedbackScore(history: FeedbackVoteSummary[]): number {
  if (history.length === 0) return 0;
  const totalImpact = history.reduce((sum, v) => sum + v.weightedImpact, 0);
  return totalImpact / Math.sqrt(history.length);
}

function computeConfidence(
  totalVotes: number,
  history: FeedbackVoteSummary[]
): number {
  if (totalVotes === 0) return 0;
  const recentVotes = history.slice(-10);
  const consistentRatio = recentVotes.filter(
    (v) => v.weightedImpact !== 0
  ).length / Math.max(recentVotes.length, 1);
  return Math.min(
    (totalVotes / 50) * 0.5 + consistentRatio * 0.5,
    1
  );
}

function mapRowToProfile(row: any): CompanyFeedbackProfile {
  return {
    companyId: row.company_id,
    vertical: row.vertical,
    feedbackScore: row.feedback_score,
    feedbackConfidence: row.feedback_confidence,
    totalVotes: row.total_votes,
    accurateVotes: row.accurate_votes,
    partialVotes: row.partial_votes,
    badVotes: row.bad_votes,
    voteHistory: (typeof row.vote_history === 'string'
      ? JSON.parse(row.vote_history)
      : row.vote_history || []) as FeedbackVoteSummary[],
    lastVoteAt: row.last_vote_at,
    updatedAt: row.updated_at,
  };
}

function mapVoteRow(row: any): FeedbackVote {
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name || '',
    vertical: row.vertical,
    voteType: row.vote_type,
    userTrust: row.user_trust,
    verticalTrust: row.vertical_trust,
    consensusWeight: row.consensus_weight,
    timeDecay: row.time_decay,
    weightedImpact: row.weighted_impact,
    leadScore: row.lead_score,
    signals: row.signals || '',
    createdAt: row.created_at,
  };
}
