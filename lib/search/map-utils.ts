export interface MapLinks {
  googleMaps: string;
  appleMaps: string;
  waze: string;
}

/**
 * Generates structured navigation links using coordinate-level precision.
 * Google Maps: renders natively on all platforms via universal URL
 * Apple Maps: forces native maps app on Apple devices
 * Waze: preferred by industrial truck drivers
 */
export function generateMapLinks(lat: number, lng: number, companyName?: string): MapLinks {
  const encodedName = companyName ? encodeURIComponent(companyName) : '';

  return {
    googleMaps: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${
      encodedName ? `&query_place_id=${encodedName}` : ''
    }`,
    appleMaps: `https://maps.apple.com/?ll=${lat},${lng}&q=${encodedName || 'Disposal+Facility'}`,
    waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,
  };
}
