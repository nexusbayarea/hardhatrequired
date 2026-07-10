'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, MapPin, Truck, Calendar, CheckCircle, XCircle, Loader2,
  ArrowUpDown, Phone, Shield, Crosshair, GripVertical,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useProject } from '@/context/ProjectContext';
import BookingModal from '@/components/equipment/BookingModal';
import type { EquipmentRentalResult, EquipmentRentalSearchResponse } from '@iie/sdk';

const EQUIPMENT_CLASSES = [
  { id: '', label: 'all types' },
  { id: 'vacuum_truck_5k', label: 'Vacuum Truck 5K' },
  { id: 'vacuum_truck_3k', label: 'Vacuum Truck 3K' },
  { id: 'excavator_heavy', label: 'Excavator (Heavy)' },
  { id: 'end_dump_trailer', label: 'End Dump Trailer' },
  { id: 'frac_tank_21k', label: 'Frac Tank 21K' },
  { id: 'dewatering_pump', label: 'Dewatering Pump' },
];

export default function EquipmentExchange() {
  const { t } = useLanguage();
  const { activeProject } = useProject();

  const [latitude, setLatitude] = useState<number>(37.7749);
  const [longitude, setLongitude] = useState<number>(-122.4194);
  const [radiusMiles, setRadiusMiles] = useState(25);
  const [equipmentClass, setEquipmentClass] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState<EquipmentRentalResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'composite' | 'distance' | 'daily_rate'>('composite');
  const [bookingTarget, setBookingTarget] = useState<EquipmentRentalResult | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setGeoLoading(false);
        },
        () => {
          setGeoLoading(false);
        },
        { timeout: 5000, enableHighAccuracy: false },
      );
    } else {
      setGeoLoading(false);
    }
  }, []);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/equipment/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude,
          longitude,
          radius_miles: radiusMiles,
          equipment_class: equipmentClass || undefined,
          target_date: targetDate,
        }),
      });
      const data: EquipmentRentalSearchResponse = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radiusMiles, equipmentClass, targetDate]);

  const sorted = useMemo(() => {
    const copy = [...results];
    copy.sort((a, b) => {
      if (sortBy === 'composite') return b.composite_confidence_rating - a.composite_confidence_rating;
      if (sortBy === 'distance') return a.distance_miles - b.distance_miles;
      return a.daily_rate - b.daily_rate;
    });
    return copy;
  }, [results, sortBy]);

  const totalBudget = (item: EquipmentRentalResult) => item.daily_rate + item.delivery_fee;
  const weeklyBudget = (item: EquipmentRentalResult) => item.daily_rate * 5 + item.delivery_fee;

  const confidenceColor = (val: number) => {
    if (val >= 80) return 'var(--color-green)';
    if (val >= 60) return 'var(--color-yellow)';
    return 'var(--color-red)';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          {t('equipment search & discovery')}
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
          {t('geospatial rental search with proximity scoring and confidence ratings')}
        </p>
      </div>

      {/* Search panel */}
      <div
        className="rounded-xl p-6 space-y-5"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="field-label"><Truck className="w-4 h-4" />{t('equipment class')}</label>
            <select value={equipmentClass} onChange={e => setEquipmentClass(e.target.value)} className="field-input">
              {EQUIPMENT_CLASSES.map(ec => (
                <option key={ec.id} value={ec.id}>{t(ec.label.toLowerCase())}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">
              <MapPin className="w-4 h-4" />{t('location')}
              {geoLoading && <Loader2 className="w-3 h-3 animate-spin inline ml-1" />}
            </label>
            <div className="text-sm font-mono" style={{ color: 'var(--color-text)', lineHeight: '42px', paddingLeft: '4px' }}>
              {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </div>
          </div>

          <div>
            <label className="field-label"><Crosshair className="w-4 h-4" />{t('search radius')}</label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={5} max={100} step={5}
                value={radiusMiles} onChange={e => setRadiusMiles(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <span className="font-mono text-xs font-bold min-w-[3rem] text-right" style={{ color: 'var(--color-text)' }}>
                {radiusMiles} {t('mi')}
              </span>
            </div>
          </div>

          <div>
            <label className="field-label"><Calendar className="w-4 h-4" />{t('target date')}</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="field-input" />
          </div>

          <div className="flex items-end">
            <button onClick={fetchEquipment} disabled={loading || geoLoading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {loading ? t('searching...') : t('search equipment')}
            </button>
          </div>
        </div>
      </div>

      {/* Sort / view toggle */}
      {searched && !loading && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            {(['composite', 'distance', 'daily_rate'] as const).map(key => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  background: sortBy === key ? 'var(--color-indigo)' : 'var(--color-surface)',
                  color: sortBy === key ? 'white' : 'var(--color-text)',
                  border: sortBy === key ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {t(key)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowTable(v => !v)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg sm:hidden"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
          >
            {showTable ? t('cards') : t('table')}
          </button>
        </div>
      )}

      {/* Card matrix (mobile) / comparative table (desktop) */}
      {loading ? (
        <div className="rounded-xl p-16 flex flex-col items-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: 'var(--color-muted)' }} />
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('searching equipment inventory...')}</div>
        </div>
      ) : searched && sorted.length === 0 ? (
        <div className="rounded-xl p-16 flex flex-col items-center text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Truck className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
          <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{t('no equipment found')}</div>
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('try expanding the search radius or changing the equipment class.')}</div>
        </div>
      ) : searched ? (
        <>
          {/* Mobile: Card matrix */}
          <div className={`grid grid-cols-1 sm:hidden gap-4 ${showTable ? 'hidden' : ''}`}>
            {sorted.map(item => (
              <EquipmentCard
                key={item.id}
                item={item}
                totalBudget={totalBudget(item)}
                weeklyBudget={weeklyBudget(item)}
                confidenceColor={confidenceColor(item.composite_confidence_rating)}
                onBook={() => setBookingTarget(item)}
              />
            ))}
          </div>

          {/* Desktop: Comparative table matching the SlurryFlow prototype */}
          <div className="hidden sm:block rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b" style={{ background: 'var(--color-surface2)', borderColor: 'var(--color-border)' }}>
                    <th className="p-3.5 font-semibold" style={{ color: 'var(--color-muted)' }}>{t('rental partner')}</th>
                    <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--color-muted)' }}>{t('distance (s_prox)')}</th>
                    <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--color-muted)' }}>{t('trust index (t)')}</th>
                    <th className="p-3.5 font-semibold text-center" style={{ color: 'var(--color-muted)' }}>{t('composite rank')}</th>
                    <th className="p-3.5 font-semibold text-right" style={{ color: 'var(--color-muted)' }}>{t('daily rate')}</th>
                    <th className="p-3.5 font-semibold text-right hidden lg:table-cell" style={{ color: 'var(--color-muted)' }}>{t('delivery')}</th>
                    <th className="p-3.5 font-semibold text-right" style={{ color: 'var(--color-muted)' }}>{t('estimated total')}</th>
                    <th className="p-3.5 font-semibold text-center">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                  {sorted.map(item => (
                    <tr key={item.id} className="transition-colors" style={{ background: 'transparent' }}>
                      <td className="p-3.5">
                        <div className="font-bold" style={{ color: 'var(--color-text)' }}>{item.provider_name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                          {item.equipment_class.replace(/_/g, ' ')}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="font-mono" style={{ color: 'var(--color-text)' }}>{item.distance_miles} mi</div>
                        <div className="text-[9px] font-semibold" style={{ color: 'var(--color-indigo)' }}>Prox: {item.proximity_score}</div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="font-semibold font-mono" style={{ color: 'var(--color-text)' }}>{item.trust_index}%</div>
                        <div className="text-[9px]" style={{ color: 'var(--color-muted)' }}>
                          {item.is_verified_partner ? 'Insured' : 'No Ins.'}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface2)' }}>
                            <div className="h-full rounded-full" style={{
                              width: `${item.composite_confidence_rating}%`,
                              background: confidenceColor(item.composite_confidence_rating),
                            }} />
                          </div>
                          <span className="font-mono text-[11px] font-bold" style={{ color: confidenceColor(item.composite_confidence_rating) }}>
                            {item.composite_confidence_rating}
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold" style={{ color: 'var(--color-text)' }}>
                        ${item.daily_rate.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono hidden lg:table-cell" style={{ color: 'var(--color-muted)' }}>
                        ${item.delivery_fee.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold" style={{ color: 'var(--color-indigo)' }}>
                        ${(item.daily_rate + item.delivery_fee).toLocaleString()}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          {item.contact_phone && (
                            <a
                              href={`tel:${item.contact_phone}`}
                              className="p-1.5 rounded transition-colors"
                              style={{ background: 'var(--color-surface2)', color: 'var(--color-text)' }}
                              title={t('call provider')}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => setBookingTarget(item)}
                            className="text-[10px] font-bold px-3 py-1.5 rounded transition-colors"
                            style={{
                              background: 'var(--color-indigo)',
                              color: 'white',
                            }}
                          >
                            {t('book')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile table (alternative view) */}
          <div className={`sm:hidden ${showTable ? 'block' : 'hidden'}`}>
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b" style={{ background: 'var(--color-surface2)', borderColor: 'var(--color-border)' }}>
                      <th className="p-2.5 font-semibold" style={{ color: 'var(--color-muted)' }}>{t('provider')}</th>
                      <th className="p-2.5 font-semibold text-right" style={{ color: 'var(--color-muted)' }}>{t('daily')}</th>
                      <th className="p-2.5 font-semibold text-right" style={{ color: 'var(--color-muted)' }}>{t('budget')}</th>
                      <th className="p-2.5 font-semibold text-center" style={{ color: 'var(--color-muted)' }}>{t('conf.')}</th>
                      <th className="p-2.5 font-semibold text-center">{t('go')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {sorted.map(item => (
                      <tr key={item.id}>
                        <td className="p-2.5">
                          <div className="font-bold" style={{ color: 'var(--color-text)' }}>{item.provider_name}</div>
                          <div className="text-[10px] font-mono" style={{ color: 'var(--color-muted)' }}>{item.distance_miles} {t('mi')}</div>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold" style={{ color: 'var(--color-text)' }}>${item.daily_rate.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-mono font-bold" style={{ color: 'var(--color-indigo)' }}>${totalBudget(item).toLocaleString()}</td>
                        <td className="p-2.5 text-center">
                          <span className="text-[10px] font-bold" style={{ color: confidenceColor(item.composite_confidence_rating) }}>
                            {item.composite_confidence_rating}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <button onClick={() => setBookingTarget(item)} className="text-[10px] font-bold px-2.5 py-1 rounded" style={{ background: 'var(--color-indigo)', color: 'white' }}>
                            {t('book')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {bookingTarget && (
        <BookingModal
          open={!!bookingTarget}
          onClose={() => setBookingTarget(null)}
          equipment={{
            id: bookingTarget.id,
            provider_name: bookingTarget.provider_name,
            equipment_class: bookingTarget.equipment_class,
            daily_rate: bookingTarget.daily_rate,
            delivery_fee: bookingTarget.delivery_fee,
            contact_phone: bookingTarget.contact_phone,
            dispatch_email: bookingTarget.dispatch_email,
          }}
          onBooked={() => setBookingTarget(null)}
        />
      )}
    </div>
  );
}

function EquipmentCard({
  item, totalBudget, weeklyBudget, confidenceColor, onBook,
}: {
  item: EquipmentRentalResult;
  totalBudget: number;
  weeklyBudget: number;
  confidenceColor: string;
  onBook: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-base font-black" style={{ color: 'var(--color-text)' }}>{item.provider_name}</div>
          <div className="text-xs capitalize" style={{ color: 'var(--color-muted)' }}>
            {item.equipment_class.replace(/_/g, ' ')}
          </div>
          {[item.city, item.state].filter(Boolean).length > 0 && (
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
              <MapPin className="w-2.5 h-2.5 inline mr-0.5" />
              {[item.city, item.state].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-lg font-black" style={{ color: 'var(--color-text)' }}>
            ${item.daily_rate.toLocaleString()}
          </div>
          <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--color-muted)' }}>{t('per day')}</div>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3" style={{ background: 'var(--color-surface2)' }}>
          <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>{t('distance')}</div>
          <div className="text-sm font-bold font-mono" style={{ color: 'var(--color-text)' }}>{item.distance_miles} mi</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'var(--color-surface2)' }}>
          <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>{t('delivery fee')}</div>
          <div className="text-sm font-bold font-mono" style={{ color: 'var(--color-text)' }}>${item.delivery_fee.toLocaleString()}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'var(--color-surface2)' }}>
          <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>{t('total budget')}</div>
          <div className="text-sm font-bold font-mono" style={{ color: 'var(--color-red)' }}>${totalBudget.toLocaleString()}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'var(--color-surface2)' }}>
          <div className="text-[10px] font-semibold uppercase" style={{ color: 'var(--color-muted)' }}>{t('weekly estimate')}</div>
          <div className="text-sm font-bold font-mono" style={{ color: 'var(--color-text)' }}>${weeklyBudget.toLocaleString()}</div>
        </div>
      </div>

      {/* Scores */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-8 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface2)' }}>
            <div className="h-full rounded-full" style={{
              width: `${item.composite_confidence_rating}%`,
              background: confidenceColor,
            }} />
          </div>
          <span className="text-xs font-bold font-mono" style={{ color: confidenceColor }}>{item.composite_confidence_rating}</span>
        </div>
        <div className="flex items-center gap-1">
          <GripVertical className="w-3 h-3" style={{ color: 'var(--color-indigo)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>{t('prox')}: {item.proximity_score}</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3" style={{ color: item.trust_index >= 70 ? 'var(--color-green)' : 'var(--color-yellow)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>{t('trust')}: {item.trust_index}%</span>
        </div>
        {item.is_verified_partner && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--color-green) 12%, transparent)', color: 'var(--color-green)' }}>
            {t('insured')}
          </span>
        )}
        {item.requires_cdl && (
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--color-yellow) 12%, transparent)', color: 'var(--color-yellow)' }}>
            CDL
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {item.contact_phone && (
          <a href={`tel:${item.contact_phone}`} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-xs" style={{ height: '42px' }}>
            <Phone className="w-4 h-4" />{t('call')}
          </a>
        )}
        <button onClick={onBook} className="btn-primary flex-1 text-xs" style={{ height: '42px' }}>
          {t('reserve gear')}
        </button>
      </div>
    </div>
  );
}
