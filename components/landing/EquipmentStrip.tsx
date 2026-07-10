'use client';

import { useState, useEffect } from 'react';
import { Truck, Container, Fuel, Zap, Drill, Gauge, ArrowRight, Loader } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface EquipmentItem {
  id: string;
  name: string;
  company: string;
  city: string;
  availability: string;
  icon: any;
}

const ICONS = [Truck, Container, Fuel, Zap, Drill, Gauge];

export default function EquipmentStrip() {
  const { t } = useLanguage();
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetch('/api/public/equipment', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.featured?.length) {
          setEquipment(data.featured.map((f: any, i: number) => ({
            id: `eq-${i}`,
            name: f.equipment,
            company: f.company,
            city: f.city,
            availability: f.availability,
            icon: ICONS[i % ICONS.length],
          })));
          setHasData(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!hasData && !loading) return null;

  return (
    <section className="py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="mb-12">
          <p className="section-label mb-4">{t('equipment availability')}</p>
          <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
            {t('nearby equipment.')}<br />
            <span style={{ color: 'var(--color-muted)' }}>{t('ready to roll.')}</span>
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
              {t('Available near you')}
            </span>
            {hasData && (
              <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                {equipment.length} {t('assets found')}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin" style={{ color: 'var(--color-red)' }} />
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
                      <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {item.company} · {item.city}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-xs font-semibold"
                        style={{ color: 'var(--color-green)' }}
                      >
                        {item.availability}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasData && (
            <div
              className="px-6 py-3 border-t flex items-center justify-center gap-2 transition-colors"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                {t('View full equipment catalog')}
              </span>
              <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
