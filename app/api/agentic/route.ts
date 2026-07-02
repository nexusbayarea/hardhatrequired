import { NextRequest, NextResponse } from 'next/server';
import { GeminiScraperAdapter } from '@/lib/market/providers/geminiScraper';
import { VERTICAL_REGISTRY } from '@/lib/market/registry';
import { harvestContractorSignals } from '@/lib/discovery/edgeScraper';

const deepScraper = new GeminiScraperAdapter();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, verticalId, deep } = body as { url?: string; verticalId?: string; deep?: boolean };

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    const verticalConfig = verticalId ? VERTICAL_REGISTRY[verticalId] : null;
    const keywords = verticalConfig?.equipmentKeywords || [];

    // Tier 1: Fast edge scrape (<500ms, no LLM)
    let fastResult = null;
    try {
      fastResult = await harvestContractorSignals(url, keywords, 4000);
    } catch {
      fastResult = { scrapedText: '', scrapedKeywords: [], scrapedIsCommercial: false, scrapedIsResidential: false, scrapedLicenseNumbers: [] };
    }

    // Tier 2: Deep LLM analysis (only if requested)
    let deepResult = null;
    if (deep) {
      const [signalResult, autonomousResult] = await Promise.all([
        deepScraper.scanForSignals(url, keywords).catch(() => null),
        deepScraper.autonomousScrape(url, `Analyze this company website and extract:
1. What services do they offer?
2. What equipment do they operate?
3. What industries do they serve?
4. What licenses or certifications do they have?
Return ONLY a JSON object with { services: string[], equipment: string[], industries: string[], certifications: string[], summary: string }.`).catch(() => null),
      ]);
      deepResult = { signals: signalResult, extract: autonomousResult };
    }

    return NextResponse.json({
      success: true,
      url,
      vertical: verticalId || 'unknown',
      fastScan: fastResult,
      deepExtract: deepResult,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Agentic scrape failed', detail: String(err) },
      { status: 500 }
    );
  }
}
