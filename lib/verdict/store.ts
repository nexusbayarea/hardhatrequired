import fs from 'fs';
import path from 'path';
import type { VerdictEntry, VerdictSummary } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const VERDICTS_FILE = path.join(DATA_DIR, 'verdicts.json');

export class VerdictStore {
  private verdicts: Map<string, VerdictEntry> = new Map();
  private loaded = false;

  constructor() {
    this.load();
  }

  private key(entry: { companyId: string; vertical: string; mode: string }): string {
    return `${entry.companyId}|${entry.vertical}|${entry.mode}`;
  }

  get(companyId: string, vertical: string, mode: string): VerdictEntry | undefined {
    this.load();
    return this.verdicts.get(this.key({ companyId, vertical, mode }));
  }

  set(entry: VerdictEntry): void {
    const k = this.key(entry);
    this.verdicts.set(k, entry);
    this.save();
  }

  has(companyId: string, vertical: string, mode: string): boolean {
    return this.verdicts.has(this.key({ companyId, vertical, mode }));
  }

  all(): VerdictEntry[] {
    this.load();
    return Array.from(this.verdicts.values());
  }

  forVertical(vertical: string, mode: string): VerdictEntry[] {
    return this.all().filter(e => e.vertical === vertical && e.mode === mode);
  }

  goodCompanyIds(vertical: string, mode: string): Set<string> {
    return new Set(
      this.forVertical(vertical, mode)
        .filter(e => e.verdict === 'good')
        .map(e => e.companyId)
    );
  }

  badCompanyIds(vertical: string, mode: string): Set<string> {
    return new Set(
      this.forVertical(vertical, mode)
        .filter(e => e.verdict === 'bad')
        .map(e => e.companyId)
    );
  }

  stats(): VerdictSummary {
    const entries = this.all();
    const byVertical: VerdictSummary['byVertical'] = {};
    for (const e of entries) {
      if (!byVertical[e.vertical]) {
        byVertical[e.vertical] = { total: 0, good: 0, bad: 0, uncertain: 0 };
      }
      byVertical[e.vertical].total++;
      byVertical[e.vertical][e.verdict]++;
    }
    return {
      total: entries.length,
      good: entries.filter(e => e.verdict === 'good').length,
      bad: entries.filter(e => e.verdict === 'bad').length,
      uncertain: entries.filter(e => e.verdict === 'uncertain').length,
      byVertical,
    };
  }

  private load(): void {
    if (this.loaded) return;
    try {
      if (fs.existsSync(VERDICTS_FILE)) {
        const raw = JSON.parse(fs.readFileSync(VERDICTS_FILE, 'utf-8'));
        const entries: VerdictEntry[] = Array.isArray(raw) ? raw : [];
        for (const entry of entries) {
          this.verdicts.set(
            this.key({ companyId: entry.companyId, vertical: entry.vertical, mode: entry.mode }),
            entry
          );
        }
      }
    } catch (e) {
      console.warn('[VerdictStore] Could not load verdicts:', e);
    }
    this.loaded = true;
  }

  private save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      const data = Array.from(this.verdicts.values());
      fs.writeFileSync(VERDICTS_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('[VerdictStore] Could not save verdicts:', e);
    }
  }
}

export const globalVerdictStore = new VerdictStore();
