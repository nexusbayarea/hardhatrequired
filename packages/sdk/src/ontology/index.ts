export interface OntologyNode {
  id: string;
  label: string;
  type: string;
  parentId?: string;
  children?: OntologyNode[];
  metadata?: Record<string, unknown>;
}

export interface OntologyMatch {
  nodeId: string;
  label: string;
  confidence: number;
  score: number;
}

export interface VectorSearchResult {
  id: string;
  label: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export async function searchOntology(query: string, topK = 10): Promise<VectorSearchResult[]> {
  const res = await fetch('/api/ontology/vector-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, topK }),
  });
  if (!res.ok) throw new Error(`Ontology search failed: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

export async function getOntologyTree(vertical?: string): Promise<OntologyNode[]> {
  const res = await fetch('/api/ontology/tree', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vertical }),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.tree || [];
}
