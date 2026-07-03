import { cleanScrapedText, chunkText } from './cleaner';
import { runDeterministicExtractionAsync, runDeterministicExtraction } from './engine';
import { runLlmExtractionFallback } from './llm';
import { ExtractionPayload } from './ontology';
import { hasDisposalSignals } from '@/lib/ontology/matcher';

export interface ScrapeResult {
  /** Cleaned text from the scrape */
  cleanText: string;
  /** Number of chunks (for logging) */
  chunkCount: number;
  /** Extraction payload */
  extraction: ExtractionPayload;
  /** Whether LLM was invoked */
  llmTriggered: boolean;
}

/**
 * Full Stage 3 extraction pipeline:
 * 1. Clean raw HTML/text
 * 2. Chunk
 * 3. Trie-backed deterministic extraction (DB/Redis with hardcoded fallback)
 * 4. LLM fallback if deterministic weak (L3)
 * 5. Return structured payload
 */
export async function processScrape(
  rawText: string | null | undefined,
  vertical: string,
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    cleanText: '',
    chunkCount: 0,
    extraction: {
      services: [],
      equipment: [],
      wasteTypes: [],
      fitType: null,
      confidence: 0,
    },
    llmTriggered: false,
  };

  if (!rawText) return result;

  // Step 1: Clean
  const cleanText = cleanScrapedText(rawText);
  if (!cleanText) return result;
  result.cleanText = cleanText;

  // Step 2: Chunk (for future multi-chunk processing)
  const chunks = chunkText(cleanText);
  result.chunkCount = chunks.length;

  // Step 3: Trie-backed deterministic extraction
  const deterministic = await runDeterministicExtractionAsync(cleanText, vertical);
  result.extraction = deterministic;

  // Step 4: LLM fallback if deterministic was weak
  const totalHits = deterministic.services.length + deterministic.equipment.length;
  if (totalHits < 2 || deterministic.confidence < 70) {
    const llmResult = await runLlmExtractionFallback(cleanText, vertical, deterministic);
    result.extraction = llmResult;
    result.llmTriggered = true;
  }

  return result;
}

/**
 * Quick check if text has any useful signals.
 * Uses synchronous fallback (hardcoded dictionaries).
 */
export function hasUsefulContent(
  rawText: string | null | undefined,
  vertical: string,
): boolean {
  if (!rawText) return false;
  const clean = cleanScrapedText(rawText);
  if (!clean) return false;
  const extraction = runDeterministicExtraction(clean, vertical);
  return extraction.services.length > 0 || extraction.equipment.length > 0 || hasDisposalSignals(clean);
}
