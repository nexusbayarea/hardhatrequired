'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, MapPin, Truck, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useProject } from '@/context/ProjectContext';

interface EquipmentItem {
  id: string;
  type: string;
  name: string;
  dailyRate: number;
  deliveryFee: number;
  partner: string;
  distance: number;
  available: boolean;
}

export default function EquipmentExchange() {
  const { t } = useLanguage();
  const { activeProject, bookEquipment, releaseEquipment, isEquipmentBooked } = useProject();

  const [eqType, setEqType] = useState('');
  const [zip, setZip] = useState(activeProject?.zip || '94538');
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [results, setResults] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchEquipment = useCallback(async () => {
    if (!activeProject) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch('/api/equipment-rental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verticalId: activeProject.vertical,
          zip,
          radiusMiles: activeProject.radius || 80,
          equipmentTypes: eqType ? [eqType] : undefined,
        }),
      });
      const data = await res.json();
      const items: EquipmentItem[] = (data.results || []).map((r: any, idx: number) => ({
        id: r.id || `eq-${idx}-${Date.now()}`,
        type: (r.equipmentTypes?.[0] || 'other'),
        name: r.name || 'Unknown Equipment',
        dailyRate: r.dailyRate || Math.round(400 + Math.random() * 1000),
        deliveryFee: r.deliveryAvailable ? Math.round(150 + Math.random() * 300) : 0,
        partner: r.name || 'Unknown Vendor',
        distance: r.distanceMiles || Math.round(5 + Math.random() * 20),
        available: r.availableUnits == null || r.availableUnits > 0,
      }));
      setResults(items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activeProject, zip, eqType]);

  useEffect(() => {
    if (activeProject) {
      fetchEquipment();
    }
  }, [activeProject?.id]);

  const filteredEquipment = useMemo(() => {
    if (!eqType) return results;
    return results.filter(eq => eq.type === eqType);
  }, [results, eqType]);

  const equipmentTypes = useMemo(() => {
    const types = new Set(results.map(r => r.type));
    return [...types].filter(Boolean).map(t => ({ id: t, label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));
  }, [results]);

  if (!activeProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>{t('equipment exchange')}</h1>
          <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
            {t('select or create a project workspace to book equipment.')}
          </p>
        </div>
        <div className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <Truck className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
          <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{t('no active project')}</div>
          <div className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('create a project from the sidebar to book equipment.')}</div>
        </div>
      </div>
    );
  }

  const toggleBook = (equipId: string) => {
    if (isEquipmentBooked(activeProject.id, equipId)) {
      releaseEquipment(activeProject.id, equipId);
    } else {
      bookEquipment(activeProject.id, equipId);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          {t('equipment exchange')}
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
          {t('rental comparison, availability, delivery ETA, and rate intelligence')}
        </p>
      </div>

      {/* Project context */}
      <div
        className="rounded-xl p-4 flex items-center gap-4"
        style={{ background: 'color-mix(in srgb, var(--color-indigo) 8%, var(--color-surface))', border: '1px solid color-mix(in srgb, var(--color-indigo) 20%, transparent)' }}
      >
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            {t('active project')}
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{activeProject.name}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
            {activeProject.bookedEquipment.length} {t('units booked')} · {activeProject.volume.toLocaleString()} gal
          </div>
        </div>
      </div>

      {/* Search */}
      <div
        className="rounded-xl p-6 space-y-5"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="field-label"><Truck className="w-4 h-4" />{t('equipment type')}</label>
            <select value={eqType} onChange={e => setEqType(e.target.value)} className="field-input">
              <option value="">{t('all types')}</option>
              {equipmentTypes.map(et => (
                <option key={et.id} value={et.id}>{et.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label"><MapPin className="w-4 h-4" />{t('location')}</label>
            <input type="text" value={zip} onChange={e => setZip(e.target.value)}
              placeholder="94538" className="field-input" />
          </div>

          <div>
            <label className="field-label"><Calendar className="w-4 h-4" />{t('delivery date')}</label>
            <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
              className="field-input" />
          </div>

          <div className="flex items-end">
            <button onClick={fetchEquipment} disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {loading ? t('searching...') : t('search equipment')}
            </button>
          </div>
        </div>
      </div>

      {/* Results table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400">
                <th className="p-3.5 font-semibold">{t('rental partner')}</th>
                <th className="p-3.5 font-semibold text-center">{t('distance')}</th>
                <th className="p-3.5 font-semibold text-center">{t('status')}</th>
                <th className="p-3.5 font-semibold text-right">{t('daily rate')}</th>
                <th className="p-3.5 font-semibold text-right">{t('delivery')}</th>
                <th className="p-3.5 font-semibold text-right">{t('total')}</th>
                <th className="p-3.5 font-semibold text-center">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEquipment.map(eq => {
                const booked = isEquipmentBooked(activeProject.id, eq.id);
                return (
                  <tr key={eq.id} className="hover:bg-slate-950/40 transition-colors text-slate-300">
                    <td className="p-3.5">
                      <div className="font-bold text-white">{eq.name}</div>
                      <div className="text-[10px] text-slate-500">{eq.partner}</div>
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-400">{eq.distance} {t('mi')}</td>
                    <td className="p-3.5 text-center">
                      {eq.available ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                          style={{ background: 'color-mix(in srgb, var(--color-green) 12%, transparent)', color: 'var(--color-green)', border: '1px solid color-mix(in srgb, var(--color-green) 25%, transparent)' }}>
                          <CheckCircle className="w-2.5 h-2.5 inline mr-0.5" /> {t('available')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                          style={{ background: 'color-mix(in srgb, var(--color-red) 12%, transparent)', color: 'var(--color-red)', border: '1px solid color-mix(in srgb, var(--color-red) 25%, transparent)' }}>
                          <XCircle className="w-2.5 h-2.5 inline mr-0.5" /> {t('unavailable')}
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">${eq.dailyRate.toLocaleString()}/day</td>
                    <td className="p-3.5 text-right font-mono text-slate-400">${eq.deliveryFee.toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold" style={{ color: 'var(--color-indigo)' }}>
                      ${(eq.dailyRate + eq.deliveryFee).toLocaleString()}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => toggleBook(eq.id)}
                        disabled={!eq.available}
                        className="text-[10px] font-bold px-3 py-1.5 rounded transition-colors"
                        style={{
                          opacity: eq.available ? 1 : 0.4,
                          cursor: eq.available ? 'pointer' : 'not-allowed',
                          background: booked
                            ? 'color-mix(in srgb, var(--color-red) 15%, transparent)'
                            : eq.available
                            ? 'var(--color-green)'
                            : 'var(--color-surface2)',
                          color: booked ? 'var(--color-red)' : eq.available ? 'white' : 'var(--color-muted)',
                          border: booked ? '1px solid color-mix(in srgb, var(--color-red) 30%, transparent)' : 'none',
                        }}
                      >
                        {booked ? t('release') : t('reserve')}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && searched && filteredEquipment.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center" style={{ color: 'var(--color-muted)' }}>
                    {t('no equipment found for this area')}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center" style={{ color: 'var(--color-muted)' }}>
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    {t('searching equipment inventory...')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
