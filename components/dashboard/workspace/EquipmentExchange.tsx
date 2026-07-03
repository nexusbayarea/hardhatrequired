'use client';

import { useState } from 'react';
import { Search, MapPin, Truck, Calendar, Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const EQUIPMENT_TYPES = [
  'Vacuum Truck', 'Hydro-Excavator', 'Dump Truck', 'Roll-off Truck',
  'Water Truck', 'Semi-End Dump', 'Crane', 'Forklift',
  'Concrete Pump', 'Generator', 'Air Compressor', 'Welder',
];

export default function EquipmentExchange() {
  const { t } = useLanguage();
  const [eqType, setEqType] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [zip, setZip] = useState('94538');
  const [deliveryWindow, setDeliveryWindow] = useState('today');

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

      {/* Search */}
      <div
        className="rounded-xl p-6 space-y-5"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="field-label"><Truck className="w-4 h-4" />{t('equipment type')}</label>
            <select value={eqType} onChange={e => setEqType(e.target.value)} className="field-input">
              <option value="" disabled>{t('(select)')}</option>
              {EQUIPMENT_TYPES.map(et => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">{t('min capacity (gal)')}</label>
            <input type="number" value={minCapacity} onChange={e => setMinCapacity(e.target.value)}
              placeholder="3000" className="field-input" />
          </div>

          <div>
            <label className="field-label"><MapPin className="w-4 h-4" />{t('location')}</label>
            <input type="text" value={zip} onChange={e => setZip(e.target.value)}
              placeholder="94538" className="field-input" />
          </div>

          <div>
            <label className="field-label"><Calendar className="w-4 h-4" />{t('delivery window')}</label>
            <select value={deliveryWindow} onChange={e => setDeliveryWindow(e.target.value)} className="field-input">
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="this-week">This Week</option>
              <option value="next-week">Next Week</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary">
            <Search className="w-5 h-5" /> {t('search equipment')}
          </button>
        </div>
      </div>

      {/* Results table placeholder */}
      <div
        className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <Truck className="w-10 h-10 mb-4" style={{ color: 'var(--color-muted)' }} />
        <div className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>{t('equipment exchange')}</div>
        <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {t('select equipment type and location to view available rentals, rates, and delivery estimates.')}
        </div>
      </div>
    </div>
  );
}
