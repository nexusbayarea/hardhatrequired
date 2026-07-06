'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { getVerticalEstimatorConfig } from '@/lib/logistics/normalizer';

type TrafficLevel = 'normal' | 'heavy' | 'extreme';
type CrewSize = 'driver' | 'driver_helper' | 'multi_crew';

const TRAFFIC_MULTIPLIERS: Record<TrafficLevel, { label: string; multiplier: number }> = {
  normal: { label: 'Normal', multiplier: 1.0 },
  heavy: { label: 'Heavy', multiplier: 1.35 },
  extreme: { label: 'Extreme', multiplier: 1.75 },
};

const CREW_RATES: Record<CrewSize, { label: string; rateMultiplier: number }> = {
  driver: { label: 'Driver only', rateMultiplier: 1.0 },
  driver_helper: { label: 'Driver + helper', rateMultiplier: 1.45 },
  multi_crew: { label: 'Multi crew', rateMultiplier: 1.85 },
};

interface Props {
  targetVolume: number;
  onVolumeChange: (v: number) => void;
  vertical?: string;
  distanceMiles?: number;
}

export default function LogisticsController({ targetVolume, onVolumeChange, vertical, distanceMiles }: Props) {
  const { t } = useLanguage();
  const [traffic, setTraffic] = useState<TrafficLevel>('normal');
  const [crew, setCrew] = useState<CrewSize>('driver');

  const config = getVerticalEstimatorConfig(vertical || '');
  const trafficCfg = TRAFFIC_MULTIPLIERS[traffic];
  const crewCfg = CREW_RATES[crew];

  const metrics = useMemo(() => {
    const trips = Math.ceil(targetVolume / config.truckCapacityGallons) || 1;
    const baseSpeed = config.averageTruckSpeedMph;
    const effectiveSpeed = baseSpeed / trafficCfg.multiplier;
    const totalTransit = (distanceMiles || 50) * 2 * trips;
    const transitHours = totalTransit / effectiveSpeed;
    const totalOpHours = transitHours + (trips * (config.loadTimeMinutes + config.dumpTimeMinutes)) / 60;
    const effectiveRate = config.truckHourlyRate * crewCfg.rateMultiplier;
    const haulingCost = Math.round(totalOpHours * effectiveRate);
    const disposalFee = Math.round(targetVolume * config.disposalFeePerGallon);
    const total = haulingCost + disposalFee;
    const perGal = targetVolume > 0 ? parseFloat((total / targetVolume).toFixed(3)) : 0;
    const fuelEst = Math.round(totalTransit / 5 * 4.50);

    return { trips, totalOpHours, haulingCost, disposalFee, total, perGal, fuelEst, totalTransit, effectiveSpeed };
  }, [targetVolume, distanceMiles, config, trafficCfg, crewCfg]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      data-agent-context="logistics-controller"
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
      >
        <div>
          <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {t('logistics controller')}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {t('adjust parameters to see live cost projections')}
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded" style={{
          background: 'color-mix(in srgb, var(--color-green) 12%, transparent)',
          color: 'var(--color-green)',
        }}>
          {metrics.trips} {t('load')}{metrics.trips > 1 ? 's' : ''}
        </span>
      </div>

      {/* Inputs */}
      <div className="p-5 space-y-5">
        {/* Volume */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: 'var(--color-muted)' }}>
            {t('target volume')}
          </label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={targetVolume}
                onChange={e => onVolumeChange(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 px-3 py-2 rounded-lg font-mono text-base font-bold focus:outline-none"
                style={{
                  background: 'var(--color-surface2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  appearance: 'textfield',
                }}
                data-agent-intent="update-target-gallons"
                data-agent-unit="raw-integer-gallons"
              />
              <span className="text-xs font-bold" style={{ color: 'var(--color-muted)' }}>GAL</span>
            </div>
            <input
              type="range"
              min="500"
              max="50000"
              step="500"
              value={targetVolume}
              onChange={e => onVolumeChange(parseInt(e.target.value))}
              className="flex-1 h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{ background: 'var(--color-border)', accentColor: 'var(--color-red)' }}
              data-agent-intent="slide-target-gallons-coarse"
              data-agent-unit="range-slider"
            />
          </div>
        </div>

        {/* Job variables — traffic + crew */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: 'var(--color-muted)' }}>
              {t('traffic conditions')}
            </label>
            <div className="flex gap-1.5">
              {(Object.entries(TRAFFIC_MULTIPLIERS) as [TrafficLevel, typeof trafficCfg][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setTraffic(key)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: traffic === key ? 'var(--color-surface)' : 'var(--color-surface2)',
                    color: traffic === key ? 'var(--color-text)' : 'var(--color-muted)',
                    border: traffic === key ? '1px solid var(--color-border)' : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                  >
                    {t(cfg.label)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block" style={{ color: 'var(--color-muted)' }}>
                {t('crew size')}
              </label>
              <div className="flex gap-1.5">
                {(Object.entries(CREW_RATES) as [CrewSize, typeof crewCfg][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setCrew(key)}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: crew === key ? 'var(--color-surface)' : 'var(--color-surface2)',
                      color: crew === key ? 'var(--color-text)' : 'var(--color-muted)',
                      border: crew === key ? '1px solid var(--color-border)' : '1px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {t(cfg.label)}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Output matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('truck capacity')}</div>
            <div className="text-lg font-black tabular-nums mt-0.5" style={{ color: 'var(--color-text)' }}>
              {config.truckCapacityGallons.toLocaleString()}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>GAL</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('hauls required')}</div>
            <div className="text-lg font-black tabular-nums mt-0.5" style={{ color: 'var(--color-red)' }}>
              {metrics.trips}
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('total transit')}</div>
            <div className="text-lg font-black tabular-nums mt-0.5" style={{ color: 'var(--color-text)' }}>
              {metrics.totalTransit}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>MI</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('operation time')}</div>
            <div className="text-lg font-black tabular-nums mt-0.5" style={{ color: 'var(--color-text)' }}>
              {metrics.totalOpHours.toFixed(1)}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>HRS</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('fuel estimate')}</div>
            <div className="text-lg font-black tabular-nums mt-0.5" style={{ color: 'var(--color-yellow)' }}>
              ${metrics.fuelEst.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('hauling cost')}</div>
            <div className="text-lg font-black tabular-nums mt-0.5" style={{ color: 'var(--color-text)' }}>
              ${metrics.haulingCost.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>{t('disposal fee')}</div>
            <div className="text-lg font-black tabular-nums mt-0.5" style={{ color: 'var(--color-yellow)' }}>
              ${metrics.disposalFee.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-lg" style={{
            background: 'color-mix(in srgb, var(--color-green) 8%, var(--color-surface2))',
            border: '1px solid color-mix(in srgb, var(--color-green) 25%, var(--color-border))',
          }}>
            <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-green)' }}>{t('total cost')}</div>
            <div className="text-lg font-black tabular-nums mt-0.5" style={{ color: 'var(--color-green)' }}>
              ${metrics.total.toLocaleString()}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--color-green)' }}>${metrics.perGal.toFixed(3)}/GAL</div>
          </div>
        </div>

        {/* Status summary */}
        <div className="flex items-center justify-between text-[11px] px-1" style={{ color: 'var(--color-muted)' }}>
          <span>{t('traffic')}: {t(trafficCfg.label)} ({trafficCfg.multiplier}x)</span>
          <span>{t('crew')}: {t(crewCfg.label)}</span>
          <span>{t('effective speed')}: {Math.round(metrics.effectiveSpeed)} mph</span>
        </div>
      </div>
    </div>
  );
}
