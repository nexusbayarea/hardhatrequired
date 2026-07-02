import { supabaseFetch } from '@/lib/db';
import { getKnowledgeGraph, updateEdgeWeight, KGRelation } from '@/lib/market/knowledge-graph';

// ─── HHR Feedback Learning Engine ────────────────────────────────────────────
//
// Users can signal feedback on any search result: accurate, incorrect,
// trusted vendor, or bad data. These signals are:
//
//   1. Stored in the `feedback_signals` table for audit / replay
//   2. Used to adjust scoring weights in-memory for the current session
//   3. Propagated to the Knowledge Graph edge weights (long-term learning)
//   4. Aggregated into a per-company trust score (TrustScore)
//
// Feedback flow:
//   User marks result → submitFeedback() → persist to DB → updateScoreWeights()
//     → updateKnowledgeGraph() → next search uses updated weights
// ──────────────────────────────────────────────────────────────────────────────

export type FeedbackType = 'accurate' | 'incorrect' | 'trusted_vendor' | 'bad_data';

export interface FeedbackSignal {
  id?: string;
  organizationId: string;
  userId: string;
  companyId: string;
  verticalId: string;
  feedbackType: FeedbackType;
  note?: string;
  resultIndex?: string;    // which search index this result came from
  searchId?: string;       // the saved search that surfaced this result
  createdAt?: string;
}

export interface TrustScore {
  companyId: string;
  score: number;            // 0–100
  positiveSignals: number;
  negativeSignals: number;
  trustedByOrgs: number;
  badDataReports: number;
  lastUpdated: string;
}

// Score delta applied to the search scoring engine per feedback type
const FEEDBACK_SCORE_DELTA: Record<FeedbackType, number> = {
  accurate:       +10,   // confirmed match → reinforce
  trusted_vendor: +20,   // strong positive → boost significantly
  incorrect:      -15,   // wrong result → penalise
  bad_data:       -30,   // garbage in the index → hard penalise
};

// Knowledge graph edge weight adjustment per feedback type
const FEEDBACK_EDGE_DELTA: Record<FeedbackType, number> = {
  accurate:       +0.02,
  trusted_vendor: +0.05,
  incorrect:      -0.03,
  bad_data:       -0.08,
};

export class FeedbackLearningEngine {

  // ── Submit a single feedback signal ──────────────────────────────────────
  async submitFeedback(signal: FeedbackSignal): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Persist to DB
      await this.persistFeedback(signal);

      // 2. Update Knowledge Graph edge weights
      this.updateKnowledgeGraph(signal);

      // 3. Recompute trust score for this company
      await this.recomputeTrustScore(signal.companyId, signal.organizationId);

      return { success: true };
    } catch (err) {
      console.error('[FeedbackLearningEngine] submitFeedback failed:', err);
      return { success: false, error: String(err) };
    }
  }

  // ── Apply feedback-adjusted score delta to a raw score ───────────────────
  //
  // Called from the scoring pipeline. If this company has accumulated feedback
  // in the session or DB, we adjust its raw score accordingly.
  //
  // This is intentionally lightweight — no async, just a sync delta lookup
  // from the in-memory cache that was primed at search time.
  //
  applyFeedbackAdjustment(
    companyId: string,
    rawScore: number,
    cache: FeedbackCache
  ): number {
    const delta = cache.get(companyId) ?? 0;
    return Math.max(0, Math.min(150, rawScore + delta));
  }

  // ── Build a feedback cache from DB for a set of company IDs ──────────────
  //
  // Call this once per search run, before scoring, to prime the adjustment
  // cache. Returns a Map<companyId, scoreDelta>.
  //
  async buildFeedbackCache(
    companyIds: string[],
    organizationId: string
  ): Promise<FeedbackCache> {
    const cache: FeedbackCache = new Map();

    if (companyIds.length === 0) return cache;

    try {
      const result = await supabaseFetch(
        `/rest/v1/feedback_signals?organization_id=eq.${organizationId}&company_id=in.(${companyIds.join(',')})&select=company_id,feedback_type`
      );
      const rows: Array<{ company_id: string; feedback_type: FeedbackType }> =
        await result.json();

      for (const row of rows) {
        const existing = cache.get(row.company_id) ?? 0;
        cache.set(
          row.company_id,
          existing + (FEEDBACK_SCORE_DELTA[row.feedback_type] ?? 0)
        );
      }
    } catch (err) {
      // Non-fatal — feedback cache failure should never block search
      console.warn('[FeedbackLearningEngine] buildFeedbackCache failed (non-fatal):', err);
    }

    return cache;
  }

  // ── Get trust score for a company ─────────────────────────────────────────
  async getTrustScore(companyId: string): Promise<TrustScore | null> {
    try {
      const result = await supabaseFetch(
        `/rest/v1/company_trust_scores?company_id=eq.${companyId}&limit=1`
      );
      const rows = await result.json();
      return rows[0] ?? null;
    } catch {
      return null;
    }
  }

  // ── Get aggregate feedback stats for a vertical ───────────────────────────
  async getVerticalFeedbackStats(
    verticalId: string,
    organizationId: string
  ): Promise<VerticalFeedbackStats> {
    const empty: VerticalFeedbackStats = {
      verticalId,
      totalSignals: 0,
      accurateCount: 0,
      incorrectCount: 0,
      trustedCount: 0,
      badDataCount: 0,
      accuracyRate: 0,
    };

    try {
      const result = await supabaseFetch(
        `/rest/v1/feedback_signals?vertical_id=eq.${verticalId}&organization_id=eq.${organizationId}&select=feedback_type`
      );
      const rows: Array<{ feedback_type: FeedbackType }> = await result.json();

      const counts = {
        accurate: 0, incorrect: 0, trusted_vendor: 0, bad_data: 0,
      };
      for (const row of rows) counts[row.feedback_type]++;

      const total = rows.length;
      return {
        verticalId,
        totalSignals: total,
        accurateCount: counts.accurate + counts.trusted_vendor,
        incorrectCount: counts.incorrect,
        trustedCount: counts.trusted_vendor,
        badDataCount: counts.bad_data,
        accuracyRate: total > 0
          ? Math.round(((counts.accurate + counts.trusted_vendor) / total) * 100)
          : 0,
      };
    } catch {
      return empty;
    }
  }

  // ── Private: persist to DB ────────────────────────────────────────────────
  private async persistFeedback(signal: FeedbackSignal): Promise<void> {
    await supabaseFetch('/rest/v1/feedback_signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        organization_id: signal.organizationId,
        user_id: signal.userId,
        company_id: signal.companyId,
        vertical_id: signal.verticalId,
        feedback_type: signal.feedbackType,
        note: signal.note ?? null,
        result_index: signal.resultIndex ?? null,
        search_id: signal.searchId ?? null,
        created_at: new Date().toISOString(),
      }),
    });
  }

  // ── Private: update KG edge weights based on feedback ────────────────────
  private updateKnowledgeGraph(signal: FeedbackSignal): void {
    const graph = getKnowledgeGraph();
    const vertexId = `v:${signal.verticalId}`;
    const delta = FEEDBACK_EDGE_DELTA[signal.feedbackType];

    // Reinforce/weaken all edges originating from this vertical
    for (const edge of graph.edges) {
      if (edge.from === vertexId) {
        updateEdgeWeight(graph, edge.from, edge.to, edge.relation as KGRelation, delta);
      }
    }
  }

  // ── Private: recompute trust score for a company ──────────────────────────
  private async recomputeTrustScore(
    companyId: string,
    organizationId: string
  ): Promise<void> {
    try {
      // Fetch all feedback for this company across all orgs
      const result = await supabaseFetch(
        `/rest/v1/feedback_signals?company_id=eq.${companyId}&select=feedback_type,organization_id`
      );
      const rows: Array<{ feedback_type: FeedbackType; organization_id: string }> =
        await result.json();

      const positive = rows.filter(
        (r) => r.feedback_type === 'accurate' || r.feedback_type === 'trusted_vendor'
      ).length;
      const negative = rows.filter((r) => r.feedback_type === 'incorrect').length;
      const badData = rows.filter((r) => r.feedback_type === 'bad_data').length;
      const trustedByOrgs = new Set(
        rows
          .filter((r) => r.feedback_type === 'trusted_vendor')
          .map((r) => r.organization_id)
      ).size;

      const total = positive + negative + badData;
      const score = total === 0
        ? 50  // neutral default
        : Math.round((positive / total) * 100);

      // Upsert trust score
      await supabaseFetch('/rest/v1/company_trust_scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          company_id: companyId,
          score,
          positive_signals: positive,
          negative_signals: negative,
          trusted_by_orgs: trustedByOrgs,
          bad_data_reports: badData,
          last_updated: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.warn('[FeedbackLearningEngine] recomputeTrustScore failed (non-fatal):', err);
    }
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedbackCache = Map<string, number>;  // companyId → scoreDelta

export interface VerticalFeedbackStats {
  verticalId: string;
  totalSignals: number;
  accurateCount: number;
  incorrectCount: number;
  trustedCount: number;
  badDataCount: number;
  accuracyRate: number;   // 0–100
}

// Singleton
export const feedbackEngine = new FeedbackLearningEngine();
