'use client';

import { useEffect, useRef } from 'react';
import type { PseoVendor } from '@/lib/pseo/types';

interface Props {
  vendors: PseoVendor[];
  cityName: string;
}

export default function VendorMap({ vendors, cityName }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || vendors.length === 0) return;

    let L: typeof import('leaflet');
    import('leaflet').then(mod => {
      L = mod.default;
      import('leaflet/dist/leaflet.css');

      const bounds = L.latLngBounds(vendors.map(v => [v.lat, v.lng] as [number, number]));
      const center = bounds.getCenter();
      const zoom = bounds.getNorthEast().equals(bounds.getSouthWest()) ? 13 : mapRef.current!.offsetWidth < 640 ? bounds.getCenter().equals(center) ? 12 : mapRef.current!.offsetWidth > 1024 ? 11 : 10 : 10;

      mapInstance.current = L.map(mapRef.current!, {
        center: [center.lat, center.lng],
        zoom,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapInstance.current);

      vendors.forEach(v => {
        L.marker([v.lat, v.lng])
          .addTo(mapInstance.current!)
          .bindPopup(`<strong>${v.company_name}</strong><br/>Trust Score: ${Math.round(v.trust_score * 100)}%`);
      });

      if (vendors.length > 1) {
        mapInstance.current.fitBounds(bounds, { padding: [30, 30] });
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [vendors]);

  if (vendors.length === 0) return null;

  return (
    <div className="w-full rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)', minHeight: '300px' }}>
      <div ref={mapRef} style={{ height: '400px', width: '100%' }} />
      <div className="px-4 py-2 text-xs" style={{ color: 'var(--color-muted)', background: 'var(--color-surface2)' }}>
        <span className="font-semibold">{vendors.length}</span> {vendors.length === 1 ? 'vendor' : 'vendors'} in {cityName}
      </div>
    </div>
  );
}
