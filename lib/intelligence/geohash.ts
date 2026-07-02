// n-vector geohash approximation — lightweight, no dependencies.
// Precision 4 = ~12mi grid, precision 5 = ~3mi grid.
// Matches industrial search radius granularity.

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

function interleave(latBits: string, lonBits: string): string {
  let result = '';
  for (let i = 0; i < Math.max(latBits.length, lonBits.length); i++) {
    if (i < lonBits.length) result += lonBits[i];
    if (i < latBits.length) result += latBits[i];
  }
  return result;
}

export function encodeGeohash(lat: number, lon: number, precision: number = 5): string {
  let minLat = -90, maxLat = 90;
  let minLon = -180, maxLon = 180;
  let latBits = '', lonBits = '';

  for (let i = 0; i < precision * 5; i++) {
    if (i % 2 === 0) {
      const mid = (minLon + maxLon) / 2;
      if (lon >= mid) { lonBits += '1'; minLon = mid; }
      else { lonBits += '0'; maxLon = mid; }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat >= mid) { latBits += '1'; minLat = mid; }
      else { latBits += '0'; maxLat = mid; }
    }
  }

  const bits = interleave(latBits, lonBits);
  let hash = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    hash += BASE32[parseInt(chunk.padEnd(5, '0'), 2)];
  }

  return hash.slice(0, precision);
}

export function buildBranchKey(
  domain?: string,
  name?: string,
  lat?: number,
  lon?: number,
  city?: string,
  state?: string
): string {
  const domainPart = domain
    ? domain.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase().trim()
    : (name || '').toLowerCase().replace(/\s+/g, '-').trim();

  const geohash = (lat != null && lon != null)
    ? encodeGeohash(lat, lon, 5)
    : (city || 'unknown').toLowerCase().replace(/\s+/g, '-');

  return `${domainPart}|${geohash}`;
}
