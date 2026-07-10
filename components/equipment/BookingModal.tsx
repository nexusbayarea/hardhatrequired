'use client';

import { useState } from 'react';
import { X, Phone, Mail, Calendar, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  equipment: {
    id: string;
    provider_name: string;
    equipment_class: string;
    daily_rate: number;
    delivery_fee: number;
    contact_phone: string | null;
    dispatch_email: string | null;
  };
  onBooked: () => void;
}

export default function BookingModal({ open, onClose, equipment, onBooked }: BookingModalProps) {
  const { t } = useLanguage();
  const [leaseStart, setLeaseStart] = useState(new Date().toISOString().split('T')[0]);
  const [leaseEnd, setLeaseEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleReserve = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/equipment/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipment_id: equipment.id,
          lease_start: leaseStart,
          lease_end: leaseEnd || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setSuccess(true);
      onBooked();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchEmail = async () => {
    if (!equipment.dispatch_email) return;
    setLoading(true);
    setError('');
    try {
      await fetch('/api/equipment/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispatch_email: equipment.dispatch_email,
          equipment_id: equipment.id,
          provider_name: equipment.provider_name,
          equipment_class: equipment.equipment_class,
          daily_rate: equipment.daily_rate,
          delivery_fee: equipment.delivery_fee,
          lease_start: leaseStart,
          lease_end: leaseEnd || undefined,
        }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = equipment.daily_rate + equipment.delivery_fee;
  const weeklyEstimate = equipment.daily_rate * 5 + equipment.delivery_fee;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg" style={{ background: 'var(--color-surface2)' }}>
          <X className="w-4 h-4" style={{ color: 'var(--color-text)' }} />
        </button>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-green)' }} />
            <div className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>{t('inquiry sent')}</div>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {t('the provider has been notified of your interest.')}
            </p>
            <button onClick={onClose} className="btn-primary mt-6" style={{ width: '100%' }}>
              {t('done')}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="text-lg font-black mb-1" style={{ color: 'var(--color-text)' }}>{equipment.provider_name}</div>
              <div className="text-sm font-medium capitalize" style={{ color: 'var(--color-muted)' }}>
                {equipment.equipment_class.replace(/_/g, ' ')}
              </div>
            </div>

            {/* Budget projection */}
            <div className="rounded-xl p-4 mb-5 grid grid-cols-2 gap-4" style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{t('daily rate')}</div>
                <div className="text-lg font-black" style={{ color: 'var(--color-text)' }}>${equipment.daily_rate.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{t('delivery fee')}</div>
                <div className="text-lg font-black" style={{ color: 'var(--color-text)' }}>${equipment.delivery_fee.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{t('total budget')}</div>
                <div className="text-lg font-black" style={{ color: 'var(--color-red)' }}>${totalBudget.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>{t('weekly estimate')}</div>
                <div className="text-lg font-black" style={{ color: 'var(--color-text)' }}>${weeklyEstimate.toLocaleString()}</div>
              </div>
            </div>

            {/* Date inputs */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="field-label"><Calendar className="w-3.5 h-3.5" />{t('lease start')}</label>
                <input type="date" value={leaseStart} onChange={e => setLeaseStart(e.target.value)} className="field-input" />
              </div>
              <div>
                <label className="field-label"><Calendar className="w-3.5 h-3.5" />{t('lease end (optional)')}</label>
                <input type="date" value={leaseEnd} onChange={e => setLeaseEnd(e.target.value)} className="field-input" />
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="field-label">{t('notes (optional)')}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="field-input" placeholder={t('special requirements or delivery instructions...')} />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl flex items-center gap-2 text-sm" style={{ background: 'color-mix(in srgb, var(--color-red) 10%, transparent)', color: 'var(--color-red)' }}>
                <AlertCircle className="w-4 h-4" />{error}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <button onClick={handleReserve} disabled={loading || !leaseStart} className="btn-primary w-full" style={{ height: '52px' }}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? t('sending inquiry...') : t('reserve gear')}
              </button>

              <div className="flex gap-3">
                {equipment.contact_phone && (
                  <a href={`tel:${equipment.contact_phone}`} className="btn-secondary flex-1 flex items-center justify-center gap-2" style={{ height: '48px' }}>
                    <Phone className="w-4 h-4" />{t('call provider')}
                  </a>
                )}
                {equipment.dispatch_email && (
                  <button onClick={handleDispatchEmail} disabled={loading} className="btn-secondary flex-1 flex items-center justify-center gap-2" style={{ height: '48px' }}>
                    <Mail className="w-4 h-4" />{t('dispatch email')}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
