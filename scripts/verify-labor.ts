/**
 * Batch verification script — runs all 20 verticals for labor mode,
 * scrapes websites to verify each result, and stores verdicts.
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs","moduleResolution":"node"}' scripts/verify-labor.ts
 *   or: npx tsx scripts/verify-labor.ts
 *
 * Requires local dev server on port 3001.
 */

import type { VerdictEntry, VerdictValue, HowReached } from '../lib/verdict/types';
import { globalVerdictStore } from '../lib/verdict/store';
import { VERTICAL_REGISTRY } from '../lib/market/registry';
import { verifyCompany } from '../lib/verdict/verifier';

const API_BASE = 'http://localhost:3001';
const ZIP = '94555';
const RADIUS = 100;
const MODE = 'labor';

interface RawCompany {
  id: string;
  companyName: string;
  website: string | null;
  leadScore: number;
  grade: string;
  fitType: string;
  source?: string;
  matchedSignals?: string[];
  [key: string]: unknown;
}

interface ApiResponse {
  companies: RawCompany[];
  count?: number;
  [key: string]: unknown;
}

async function fetchVertical(vertical: string): Promise<RawCompany[]> {
  const url = `${API_BASE}/api/search`;
  const body = JSON.stringify({
    zip: ZIP,
    radius: RADIUS,
    vertical,
    mode: MODE,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(300000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`  [ERROR] HTTP ${res.status}: ${text.slice(0, 200)}`);
    return [];
  }

  const data: ApiResponse = await res.json();
  return data.companies || [];
}

function getVerticalKeywords(verticalId: string): string[] {
  const config = VERTICAL_REGISTRY[verticalId];
  if (!config) return [];
  const keywords: string[] = [];
  for (const sig of config.signals?.primary ?? []) {
    keywords.push(sig.term);
  }
  for (const sig of config.signals?.secondary ?? []) {
    keywords.push(sig.term);
  }
  return keywords;
}

function getNegativeKeywords(verticalId: string): string[] {
  const config = VERTICAL_REGISTRY[verticalId];
  return config?.negativeKeywords ?? [];
}

async function verifyWithTimeout(
  company: RawCompany,
  vertical: string,
  kw: string[],
  negKw: string[],
  timeoutMs = 15000
): Promise<{ verdict: VerdictValue; howReached: HowReached; reason: string; evidence: string[] }> {
  const result = await Promise.race([
    verifyCompany(
      {
        id: company.id,
        companyName: company.companyName,
        website: company.website ?? null,
        source: company.source ?? 'google_places',
        score: company.leadScore,
        grade: company.grade,
        fitType: company.fitType,
        matchedSignals: company.matchedSignals,
      },
      kw,
      negKw
    ),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);

  if (!result) {
    return {
      verdict: 'uncertain' as VerdictValue,
      howReached: 'website_unreachable' as HowReached,
      reason: 'Website scrape timed out',
      evidence: [],
    };
  }

  return result as { verdict: VerdictValue; howReached: HowReached; reason: string; evidence: string[] };
}

async function main() {
  console.log('='.repeat(80));
  console.log('LABOR VERTICAL VERIFICATION');
  console.log(`ZIP: ${ZIP}  Radius: ${RADIUS}mi  Mode: ${MODE}`);
  console.log('='.repeat(80));

  const store = globalVerdictStore;
  const verticals = Object.values(VERTICAL_REGISTRY).map(v => v.id);
  const results: { vertical: string; total: number; good: number; bad: number; uncertain: number; skipped: number }[] = [];

  for (const vertical of verticals) {
    console.log(`\n── ${vertical} ──`);
    console.log(`  Fetching...`);

    const companies = await fetchVertical(vertical);
    console.log(`  Found ${companies.length} companies`);

    const kw = getVerticalKeywords(vertical);
    const negKw = getNegativeKeywords(vertical);

    let good = 0, bad = 0, uncertain = 0, skipped = 0;

    for (let i = 0; i < companies.length; i++) {
      const c = companies[i];
      const existing = store.get(c.id, vertical, MODE);

      if (existing) {
        skipped++;
        const label = existing.verdict === 'good' ? '✓' : existing.verdict === 'bad' ? '✗' : '?';
        process.stdout.write(`    [${label}] (cached) ${c.companyName.slice(0, 55)}\n`);
        continue;
      }

      process.stdout.write(`    [ ] ${c.companyName.slice(0, 55)}... `);

      const verdict = await verifyWithTimeout(c, vertical, kw, negKw);

      const entry: VerdictEntry = {
        companyId: c.id,
        companyName: c.companyName,
        vertical,
        mode: MODE,
        verdict: verdict.verdict,
        score: c.leadScore,
        grade: c.grade,
        fitType: c.fitType,
        website: c.website ?? null,
        reason: verdict.reason,
        howReached: verdict.howReached,
        evidence: verdict.evidence,
        verifiedAt: new Date().toISOString(),
        source: c.source ?? 'google_places',
      };

      store.set(entry);

      const label = verdict.verdict === 'good' ? '✓' : verdict.verdict === 'bad' ? '✗' : '?';
      process.stdout.write(`${label} (${verdict.howReached})\n`);

      if (verdict.verdict === 'good') good++;
      else if (verdict.verdict === 'bad') bad++;
      else uncertain++;
    }

    results.push({ vertical, total: companies.length, good, bad, uncertain, skipped });
    console.log(`  → ${good} good / ${bad} bad / ${uncertain} uncertain / ${skipped} cached`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  let totalCompanies = 0, totalGood = 0, totalBad = 0, totalUncertain = 0, totalSkipped = 0;
  for (const r of results) {
    const pct = r.total > 0 ? Math.round((r.good / r.total) * 100) : 0;
    console.log(`  ${r.vertical.padEnd(30)} ${r.total.toString().padStart(3)} companies  ${r.good.toString().padStart(2)}✓ ${r.bad.toString().padStart(2)}✗ ${r.uncertain.toString().padStart(2)}?  ${r.skipped.toString().padStart(3)} cached  ${pct}% good`);
    totalCompanies += r.total;
    totalGood += r.good;
    totalBad += r.bad;
    totalUncertain += r.uncertain;
    totalSkipped += r.skipped;
  }

  console.log('-'.repeat(80));
  console.log(`  TOTAL`.padEnd(30) + ` ${totalCompanies.toString().padStart(3)} companies  ${totalGood.toString().padStart(2)}✓ ${totalBad.toString().padStart(2)}✗ ${totalUncertain.toString().padStart(2)}?  ${totalSkipped.toString().padStart(3)} cached`);

  const overallPct = totalCompanies > 0 ? Math.round((totalGood / totalCompanies) * 100) : 0;
  console.log(`  Overall: ${overallPct}% good (${totalGood}/${totalCompanies - totalSkipped} verified)`);

  console.log('\nVerdicts saved to data/verdicts.json');
}

main().catch(console.error);
