'use client';

import { useState, useEffect, useMemo } from 'react';
import { Truck, Gauge, Route, DollarSign, TrendingDown, Droplets } from 'lucide-react';
import { getVerticalEstimatorConfig } from '@/lib/logistics/normalizer';
import { useLanguage } from '@/context/LanguageContext';

const GALLONS_PRESETS = [2000, 5000, 10000, 20000];

export default function LogisticsSnapshot() {
  const { t } = useLanguage();
  const [gallons, setGallons] = useState(10000);
  const [vertical, setVertical] = useState('slurry_processing');

  const config = getVerticalEstimatorConfig(vertical);

  const metrics = useMemo(() => {
    const trips = Math.ceil(gallons / config.truckCapacityGallons) || 1;
    const avgDist = 35;
    const totalTransit = avgDist * 2 * trips;
    const effectiveSpeed = config.averageTruckSpeedMph;
    const transitHours = totalTransit / effectiveSpeed;
    const totalOpHours = transitHours + (trips * (config.loadTimeMinutes + config.dumpTimeMinutes)) / 60;
    const haulingCost = Math.round(totalOpHours * config.truckHourlyRate);
    const disposalFee = Math.round(gallons * config.disposalFeePerGallon);
    const total = haulingCost + disposalFee;
    const perGal = gallons > 0 ? parseFloat((total / gallons).toFixed(3)) : 0;
    return { trips, haulingCost, disposalFee, total, perGal, totalTransit, totalOpHours };
  }, [gallons, config]);

  return (
    <section className="py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="mb-12">
          <p className="section-label mb-4">{t('live logistics estimator')}</p>
          <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
            {t('know your costs')}<br />
            <span style={{ color: 'var(--color-muted)' }}>{t('before you quote.')}</span>
          </h2>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
          >
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5" style={{ color: 'var(--color-red)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                {t('How much will it cost to haul?')}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded" style={{
              background: 'color-mix(in srgb, var(--color-green) 12%, transparent)',
              color: 'var(--color-green)',
            }}>
              ${metrics.total.toLocaleString()} {t('total estimate')}
            </span>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-3 block" style={{ color: 'var(--color-muted)' }}>
                {t('target volume')}
              </label>
              <div className="flex gap-2 mb-3">
                {GALLONS_PRESETS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGallons(g)}
                    className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: gallons === g ? 'var(--color-red)' : 'var(--color-surface2)',
                      color: gallons === g ? 'white' : 'var(--color-muted)',
                      border: gallons === g ? 'none' : '1px solid var(--color-border)',
                    }}
                  >
                    {g.toLocaleString()} GAL
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={gallons}
                onChange={e => setGallons(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                style={{ background: 'var(--color-border)', accentColor: 'var(--color-red)' }}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-lg" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Route className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('trips')}</span>
                </div>
                <div className="text-2xl font-black tabular-nums" style={{ color: 'var(--color-text)' }}>{metrics.trips}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{config.truckCapacityGallons.toLocaleString()} {t('GAL capacity')}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('transit')}</span>
                </div>
                <div className="text-2xl font-black tabular-nums" style={{ color: 'var(--color-text)' }}>{metrics.totalTransit}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{t('total miles')}</div>
              </div>
              <div className="p-4 rounded-lg" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('hauling')}</span>
                </div>
                <div className="text-2xl font-black tabular-nums" style={{ color: 'var(--color-text)' }}>${metrics.haulingCost.toLocaleString()}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{t('labor + truck')}</div>
              </div>
              <div className="p-4 rounded-lg" style={{
                background: 'color-mix(in srgb, var(--color-green) 8%, var(--color-surface2))',
                border: '1px solid color-mix(in srgb, var(--color-green) 25%, var(--color-border))',
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-3.5 h-3.5" style={{ color: 'var(--color-green)' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-green)' }}>{t('total')}</span>
                </div>
                <div className="text-2xl font-black tabular-nums" style={{ color: 'var(--color-green)' }}>${metrics.total.toLocaleString()}</div>
                <div className="text-[10px]" style={{ color: 'var(--color-green)' }}>${metrics.perGal.toFixed(3)}/{t('GAL')}</div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] flex-wrap" style={{ color: 'var(--color-muted)' }}>
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                {gallons.toLocaleString()} GAL × {config.disposalFeePerGallon}/{t('GAL')} {t('disposal')}
              </span>
              <span>·</span>
              <span>{metrics.totalOpHours.toFixed(1)} {t('operation hours')}</span>
              <span>·</span>
              <span>${metrics.disposalFee.toLocaleString()} {t('disposal fee')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
