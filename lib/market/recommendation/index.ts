import {
  getKnowledgeGraph,
  getRelated,
  getRelatedVerticals,
  KGNode,
} from '@/lib/market/knowledge-graph';

// ─── HHR Workflow Recommendation Engine ──────────────────────────────────────
//
// Given a vertical (e.g. "slurry_concrete"), this engine answers the six
// workflow questions from the HHR diagram:
//
//   W1: Need Labor?               → LaborNodes connected to this vertical
//   W2: Need Disposal?            → DisposalNodes connected to this vertical
//   W3: Need Rental Equipment?    → EquipmentNodes connected to this vertical
//   W4: Need Equipment Purchase?  → Same EquipmentNodes, purchase context
//   W5: Need Bid Help?            → BidNodes connected to this vertical
//   W6: Need Compliance Guidance? → ComplianceNodes connected to this vertical
//
// Also surfaces related verticals so users can cross-search (e.g. someone
// searching slurry_concrete is also likely interested in stormwater_swppp).
// ──────────────────────────────────────────────────────────────────────────────

export interface WorkflowRecommendation {
  verticalId: string;
  verticalLabel: string;
  labor: RecommendationItem[];
  disposal: RecommendationItem[];
  equipment: RecommendationItem[];
  bids: RecommendationItem[];
  compliance: RecommendationItem[];
  relatedVerticals: RecommendationItem[];
}

export interface RecommendationItem {
  id: string;
  label: string;
  tags: string[];
  confidence: number;      // 0–1, derived from KG edge weight
  searchQuery?: string;    // suggested search query for this item
  indexType?: string;      // which HHR index to search
}

export class RecommendationEngine {

  // ── Main entry: get full workflow recommendations for a vertical ──────────
  getWorkflowRecommendations(verticalId: string): WorkflowRecommendation | null {
    const graph = getKnowledgeGraph();
    const nodeId = `v:${verticalId}`;
    const verticalNode = graph.nodes.get(nodeId);

    if (!verticalNode) {
      console.warn(`[RecommendationEngine] Unknown vertical: ${verticalId}`);
      return null;
    }

    const labor      = getRelated(graph, nodeId, 'requires_labor')
                         .map((n) => this.toItem(n, 'labor', graph, nodeId, 'requires_labor'));
    const disposal   = getRelated(graph, nodeId, 'generates_waste')
                         .map((n) => this.toItem(n, 'disposal', graph, nodeId, 'generates_waste'));
    const equipment  = getRelated(graph, nodeId, 'uses_equipment')
                         .map((n) => this.toItem(n, 'equipment_rental', graph, nodeId, 'uses_equipment'));
    const bids       = getRelated(graph, nodeId, 'appears_in_bids')
                         .map((n) => this.toItem(n, 'bid_intelligence', graph, nodeId, 'appears_in_bids'));
    const compliance = getRelated(graph, nodeId, 'governed_by')
                         .map((n) => this.toItem(n, 'compliance', graph, nodeId, 'governed_by'));
    const related    = getRelatedVerticals(graph, verticalId)
                         .map((n) => this.toItem(n, undefined, graph, nodeId, 'related_to'));

    return {
      verticalId,
      verticalLabel: verticalNode.label,
      labor,
      disposal,
      equipment,
      bids,
      compliance,
      relatedVerticals: related,
    };
  }

  // ── Targeted: answer a single workflow question ───────────────────────────

  getNeedLabor(verticalId: string): RecommendationItem[] {
    return this.getRelatedItems(verticalId, 'requires_labor', 'labor');
  }

  getNeedDisposal(verticalId: string): RecommendationItem[] {
    return this.getRelatedItems(verticalId, 'generates_waste', 'disposal');
  }

  getNeedEquipmentRental(verticalId: string): RecommendationItem[] {
    return this.getRelatedItems(verticalId, 'uses_equipment', 'equipment_rental');
  }

  getNeedEquipmentPurchase(verticalId: string): RecommendationItem[] {
    // Same equipment nodes, purchase context (different index type)
    return this.getRelatedItems(verticalId, 'uses_equipment', 'equipment_purchase');
  }

  getNeedBidHelp(verticalId: string): RecommendationItem[] {
    return this.getRelatedItems(verticalId, 'appears_in_bids', 'bid_intelligence');
  }

  getNeedComplianceGuidance(verticalId: string): RecommendationItem[] {
    return this.getRelatedItems(verticalId, 'governed_by', 'compliance');
  }

  // ── Cross-search: given a company that matches one vertical, suggest others ─
  //
  // Example: found a concrete washout company → also check stormwater SWPPP,
  // since the KG knows slurry_concrete is related_to stormwater_swppp.
  //
  getCrossSearchSuggestions(verticalId: string): RecommendationItem[] {
    const graph = getKnowledgeGraph();
    const nodeId = `v:${verticalId}`;

    return getRelatedVerticals(graph, verticalId).map((n) =>
      this.toItem(n, undefined, graph, nodeId, 'related_to')
    );
  }

  // ── Rank results by combined KG confidence + feedback trust ──────────────
  //
  // To be called by the search pipeline after results are scored.
  // Takes the raw KG recommendations and sorts by descending confidence,
  // then optionally re-weights by a trust score lookup.
  //
  rankByConfidence<T extends { confidence?: number }>(items: T[]): T[] {
    return [...items].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private getRelatedItems(
    verticalId: string,
    relation: import('@/lib/market/knowledge-graph').KGRelation,
    indexType: string
  ): RecommendationItem[] {
    const graph = getKnowledgeGraph();
    const nodeId = `v:${verticalId}`;
    return getRelated(graph, nodeId, relation).map((n) =>
      this.toItem(n, indexType, graph, nodeId, relation)
    );
  }

  private toItem(
    node: KGNode,
    indexType: string | undefined,
    graph: import('@/lib/market/knowledge-graph').KGGraph,
    fromId: string,
    relation: import('@/lib/market/knowledge-graph').KGRelation
  ): RecommendationItem {
    // Look up edge weight for confidence
    const edge = graph.edges.find(
      (e) => e.from === fromId && e.to === node.id && e.relation === relation
    );
    const confidence = edge?.weight ?? node.weight;

    return {
      id: node.id,
      label: node.label,
      tags: node.tags,
      confidence,
      indexType,
      searchQuery: this.buildSearchQuery(node, indexType),
    };
  }

  private buildSearchQuery(node: KGNode, indexType?: string): string {
    // Build a natural-language search query from node tags
    const topTags = node.tags.slice(0, 3).join(' ');
    switch (indexType) {
      case 'labor':              return `${node.label} contractor crew`;
      case 'disposal':           return `${node.label} facility near me`;
      case 'equipment_rental':   return `${node.label} rental ${topTags}`;
      case 'equipment_purchase': return `${node.label} for sale ${topTags}`;
      case 'bid_intelligence':   return `${node.label} bid RFP`;
      case 'compliance':         return `${node.label} requirements`;
      default:                   return node.label;
    }
  }
}

// Singleton
export const recommendationEngine = new RecommendationEngine();
