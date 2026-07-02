export const NAV_FOOTER_PATTERNS = [
  /\bhome\b/i,
  /\babout\s+us?\b/i,
  /\bcontact\s+us?\b/i,
  /\bprivacy\s+policy\b/i,
  /\bterms?\s+of\s+service\b/i,
  /\bcopyright\b/i,
  /\ball\s+rights\s+reserved\b/i,
  /\bsign\s+in\b/i,
  /\bsign\s+up\b/i,
  /\blog\s+in\b/i,
  /\bnewsletter\b/i,
  /\bsubscribe\b/i,
  /\bfollow\s+us\b/i,
  /\bsitemap\b/i,
  /\bcookie\s+policy\b/i,
  /\baccessibility\b/i,
  /\bcareers?\b/i,
  /\bemployment\b/i,
  /\bfaq\b/i,
];

export const JUNK_LINES = [
  /^call\s+(now|us|today|for|at)/i,
  /^call\s+\d/i,
  /^(phone|tel|fax|email):/i,
  /^\d{3}[-.]\d{3}[-.]\d{4}/,
  /^get\s+a\s+quote/i,
  /^request\s+a\s+quote/i,
  /^free\s+(estimate|quote|consultation)/i,
  /^serving\s+(the\s+)?/i,
  /^\d+\s+years?\s+(experience|of\s+experience)/i,
  /^family\s+(owned|operated)/i,
  /^license/i,
  /^bonded/i,
  /^insured/i,
  /^warranty/i,
  /^guaranteed/i,
  /^\*.*\*$/,
];

export function cleanScrapedText(raw: string): string {
  if (!raw) return '';

  let text = raw;

  // Remove excessive whitespace
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/\t+/g, ' ');
  text = text.replace(/ +/g, ' ');

  // Split into lines and process
  const lines = text.split('\n');
  const cleaned: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Skip lines that are just punctuation or symbols
    if (/^[^a-zA-Z0-9]{1,5}$/.test(trimmed)) continue;

    // Skip very short lines (likely nav/UI artifacts)
    if (trimmed.length < 3) continue;

    // Skip lines matching known junk patterns
    if (JUNK_LINES.some(p => p.test(trimmed))) continue;

    cleaned.push(trimmed);
  }

  // Rejoin and remove nav/footer blocks
  let result = cleaned.join('\n');

  // Remove blocks that are mostly navigation/footer patterns
  const paragraphBlocks = result.split(/\n\n+/);
  const filteredBlocks = paragraphBlocks.filter(block => {
    const linesInBlock = block.split('\n');
    const navScore = linesInBlock.filter(line =>
      NAV_FOOTER_PATTERNS.some(p => p.test(line))
    ).length;
    // Drop block if > 60% of lines are nav/footer
    return linesInBlock.length === 0 || (navScore / linesInBlock.length) < 0.6;
  });

  result = filteredBlocks.join('\n\n');

  // Final cleanup
  result = result
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return result;
}

export function chunkText(text: string, maxChunkSize: number = 2000): string[] {
  if (!text) return [];

  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += (currentChunk ? '\n\n' : '') + para;
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
