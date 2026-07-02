import { verticalMatrix } from '@/lib/verticals/matrix';

const CANONICAL_TO_SLUG: Record<string, string> = {};
const SLUG_TO_CANONICAL: Record<string, string> = {};

for (const [id, entry] of Object.entries(verticalMatrix)) {
  const slug = entry.laborLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  CANONICAL_TO_SLUG[id] = slug;
  SLUG_TO_CANONICAL[slug] = id;
}

export function canonicalToVerticalSlug(canonicalId: string): string | undefined {
  return CANONICAL_TO_SLUG[canonicalId];
}

export function verticalSlugToCanonical(slug: string): string | undefined {
  return SLUG_TO_CANONICAL[slug];
}

export function verticalSlugToName(slug: string): string {
  const id = SLUG_TO_CANONICAL[slug];
  if (!id) return slug.replace(/-/g, ' ');
  return verticalMatrix[id]?.laborLabel || id;
}

export function canonicalToName(id: string): string {
  return verticalMatrix[id]?.laborLabel || id;
}

export function formatCitySlug(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatStateSlug(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
