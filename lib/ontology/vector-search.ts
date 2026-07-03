/**
 * Phase 3: Vector similarity fallback for unmatched text.
 *
 * When the Aho-Corasick trie finds no match for a phrase (e.g. "fluid reclamation
 * systems"), this module generates a single text embedding and runs cosine
 * similarity against cached ontology alias embeddings to find the nearest
 * canonical entity.
 *
 * Currently a scaffold — activate when you deploy an embedding service.
 *
 * Architecture:
 *   ontologyEmbeddings: Redis hash keyed by canonicalId
 *     → { phrase: string, embedding: number[], entityType: string }
 *
 *   search():
 *     1. Embed input phrase
 *     2. Cosine similarity against all cached ontology embeddings
 *     3. Return top-K matches above threshold
 */

export interface VectorMatch {
  canonicalId: string;
  phrase: string;
  similarity: number;
  entityType: string;
}

// Minimum cosine similarity to consider a match
const SIMILARITY_THRESHOLD = 0.75;
const MAX_RESULTS = 3;

/**
 * Generate an embedding for arbitrary text.
 * Replace with your embedding API call (OpenAI text-embedding-3-small, etc.).
 */
async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 256,
      }),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.[0]?.embedding || [];
  } catch {
    return [];
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

interface OntologyEmbedding {
  phrase: string;
  embedding: number[];
  entityType: string;
}

/**
 * Load cached ontology embeddings.
 */
async function loadEmbeddings(): Promise<Map<string, OntologyEmbedding>> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return new Map();

  try {
    const res = await fetch(`${url}/hgetall/ontology:embeddings`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return new Map();

    const raw: Record<string, string> = await res.json();
    const map = new Map<string, OntologyEmbedding>();

    for (const [canonicalId, value] of Object.entries(raw)) {
      const parsed = JSON.parse(value);
      map.set(canonicalId, {
        phrase: parsed.phrase,
        embedding: parsed.embedding,
        entityType: parsed.entityType,
      });
    }

    return map;
  } catch {
    return new Map();
  }
}

/**
 * Search for the nearest canonical entity by semantic similarity.
 * Falls back gracefully if no embedding service is available.
 */
export async function findNearestCanonical(
  phrase: string,
): Promise<VectorMatch[]> {
  const inputEmbedding = await embed(phrase);
  if (inputEmbedding.length === 0) return [];

  const embeddings = await loadEmbeddings();
  if (embeddings.size === 0) return [];

  const scored: VectorMatch[] = [];

  for (const [canonicalId, entry] of embeddings) {
    const similarity = cosineSimilarity(inputEmbedding, entry.embedding);
    if (similarity >= SIMILARITY_THRESHOLD) {
      scored.push({
        canonicalId,
        phrase: entry.phrase,
        similarity,
        entityType: entry.entityType,
      });
    }
  }

  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_RESULTS);
}
