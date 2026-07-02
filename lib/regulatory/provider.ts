import { RegulatoryFacility } from '@/lib/regulatory/types';

const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours matching market cache
let cache: { data: Map<string, RegulatoryFacility[]>; timestamp: number } | null = null;

function loadData(): Map<string, RegulatoryFacility[]> {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const fs = require('fs');
  const path = require('path');
  const dataDir = path.join(process.cwd(), 'data', 'regulatory');

  if (!fs.existsSync(dataDir)) {
    cache = { data: new Map(), timestamp: Date.now() };
    return cache.data;
  }

  const files = fs.readdirSync(dataDir).filter((f: string) => f.startsWith('calrecycle_') && !f.includes('all') && !f.includes('stats') && !f.includes('unclassified') && f.endsWith('.json'));

  const byVertical = new Map<string, RegulatoryFacility[]>();
  for (const file of files) {
    const vertical = file.replace('calrecycle_', '').replace('.json', '');
    const content = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
    byVertical.set(vertical, content as RegulatoryFacility[]);
  }

  cache = { data: byVertical, timestamp: Date.now() };
  return byVertical;
}

export function invalidateCache(): void {
  cache = null;
}

export interface RegulatorySearchOptions {
  vertical: string;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  zip?: string;
  county?: string;
  limit?: number;
}

export async function searchRegulatoryFacilities(
  options: RegulatorySearchOptions,
): Promise<RegulatoryFacility[]> {
  const byVertical = loadData();
  const facilities = byVertical.get(options.vertical) || [];

  let filtered = facilities.filter(f => f.confidence === 'high' || f.confidence === 'medium');

  if (options.lat && options.lng && options.radiusMiles) {
    filtered = filtered.filter(f => {
      if (!f.latitude || !f.longitude) return false;
      const distance = haversine(options.lat!, options.lng!, f.latitude, f.longitude);
      return distance <= options.radiusMiles!;
    });
  }

  if (options.county) {
    const searchCounty = options.county.toLowerCase();
    filtered = filtered.filter(f => f.county?.toLowerCase() === searchCounty);
  }

  if (options.zip && !options.lat) {
    const zipPrefix = options.zip.slice(0, 3);
    filtered = filtered.filter(f => f.zip?.startsWith(zipPrefix));
  }

  if (options.limit) {
    filtered = filtered.slice(0, options.limit);
  }

  return filtered;
}

export function getAvailableVerticals(): string[] {
  return Array.from(loadData().keys());
}

export function getFacilityCountByVertical(): Record<string, number> {
  const byVertical = loadData();
  const result: Record<string, number> = {};
  for (const [v, facilities] of byVertical) {
    result[v] = facilities.length;
  }
  return result;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
