'use client';

import { useState, useEffect } from 'react';
import { Truck, Wrench, Fuel, Zap, ArrowRight, Container, Drill, Gauge } from 'lucide-react';

interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  rate: string;
  available: boolean;
  partner: string;
  distance: string;
  icon: any;
}

const FALLBACK_EQUIPMENT: EquipmentItem[] = [
  { id: 'e1', name: 'Vacuum Truck 3000 GAL', type: 'vacuum_truck', rate: '$850/day', available: true, partner: 'Apex Environmental', distance: '12 mi', icon: Truck },
  { id: 'e2', name: 'Roll-Off Container 40yd', type: 'roll_off', rate: '$120/day', available: true, partner: 'Waste Management Solutions', distance: '8 mi', icon: Container },
  { id: 'e3', name: 'Frac Tank 21000 GAL', type: 'frac_tank', rate: '$450/day', available: true, partner: 'Tank Solutions Inc', distance: '22 mi', icon: Fuel },
  { id: 'e4', name: 'Generator 150kW', type: 'generator', rate: '$320/day', available: true, partner: 'Power Equipment Co', distance: '15 mi', icon: Zap },
  { id: 'e5', name: 'Hydro-Excavation Unit', type: 'hydro_excavation', rate: '$1,200/day', available: true, partner: 'SafeDig Services', distance: '18 mi', icon: Drill },
  { id: 'e6', name: 'Portable Pump 6"', type: 'pump', rate: '$280/day', available: true, partner: 'Dewatering Pro', distance: '10 mi', icon: Gauge },
];

export default function EquipmentStrip() {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/equipment-rental', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verticalId: 'slurry_processing', zip: '94538', radiusMiles: 50 }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.results?.length) {
          const items: EquipmentItem[] = data.results.slice(0, 6).map((r: any, i: number) => ({
            id: r.id || `eq-${i}`,
            name: r.name || 'Unknown Equipment',
            type: r.equipmentTypes?.[0] || 'other',
            rate: r.dailyRate ? `$${r.dailyRate}/day` : 'Contact for rate',
            available: r.availableUnits == null || r.availableUnits > 0,
            partner: r.name || 'Unknown Vendor',
            distance: r.distanceMiles ? `${r.distanceMiles} mi` : 'Local',
            icon: [Truck, Container, Fuel, Zap, Drill, Gauge][i % 6],
          }));
          setEquipment(items);
        } else {
          setEquipment(FALLBACK_EQUIPMENT);
        }
      })
      .catch(() => setEquipment(FALLBACK_EQUIPMENT))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="mb-12">
          <p className="section-label mb-4">equipment availability</p>
          <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
            nearby equipment.<br />
            <span style={{ color: 'var(--color-muted)' }}>ready to roll.</span>
          </h2>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
          >
            <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              Available near you
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--color-muted)' }}>
              {equipment.length} assets found
            </span>
          </div>

          {loading ? (
            <div className="p-8 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-lg animate-pulse" style={{ background: 'var(--color-surface2)' }} />
              ))}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {equipment.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-surface2/50"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'color-mix(in srgb, var(--color-red) 10%, var(--color-surface2))' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: 'var(--color-red)' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                        {item.name}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                        {item.partner} · {item.distance}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold" style={{ color: 'var(--color-green)' }}>
                        {item.rate}
                      </div>
                      <div
                        className="text-[10px] font-semibold"
                        style={{ color: item.available ? 'var(--color-green)' : 'var(--color-red)' }}
                      >
                        {item.available ? 'In Stock' : 'Unavailable'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            className="px-6 py-3 border-t flex items-center justify-center gap-2 transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
              View full equipment catalog
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
