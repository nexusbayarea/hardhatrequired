'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Calendar, ArrowRight, DollarSign, Loader, Sparkles } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslatableContent } from '@/hooks/useTranslatableContent';

interface Bid {
  id: string;
  title: string;
  agency: string;
  estimated_value: number;
  due_at: string;
  description: string;
  state: string;
  city: string;
  bid_source: string;
  status: string;
}

export default function LatestBidCard() {
  const { t } = useLanguage();
  const [bids, setBids] = useState<Bid[]>([]);
  const { translatedItems: translatedBids, translating } = useTranslatableContent(bids.length > 0 ? bids : null, ['title', 'agency', 'description', 'bid_source']);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetch('/api/public/bids', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.bids?.length) {
          setBids(data.bids);
          setHasData(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (bids.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % bids.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bids.length]);

  if (!hasData && !loading) return null;

  const formatValue = (v: number | null) => {
    if (!v) return t('Value undisclosed');
    return `$${v.toLocaleString()}`;
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <section className="py-24 md:py-36">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 flex items-center justify-center p-12">
          <Loader className="w-6 h-6 animate-spin" style={{ color: 'var(--color-red)' }} />
        </div>
      </section>
    );
  }

  const displayBids = translatedBids || bids;
  const bid = displayBids[activeIndex];

  return (
    <section className="py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="mb-12">
          <p className="section-label mb-4">{t('open bids')}</p>
          <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
            {t('win more work.')}<br />
            <span style={{ color: 'var(--color-muted)' }}>{t('bid smarter.')}</span>
          </h2>
        </div>

        <div
          className="rounded-xl overflow-hidden transition-all duration-300"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" style={{ color: 'var(--color-red)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                {t('Featured Opportunity')}
              </span>
            </div>
            <div className="flex gap-1">
              {displayBids.map((_, i) => (
                <span
                  key={i}
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: i === activeIndex ? '16px' : '5px',
                    height: '5px',
                    background: i === activeIndex ? 'var(--color-red)' : 'var(--color-border)',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="p-6" key={bid.id}>
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold px-2 py-1 rounded" style={{
                    background: bid.status === 'closing_soon'
                      ? 'color-mix(in srgb, var(--color-red) 12%, transparent)'
                      : 'color-mix(in srgb, var(--color-green) 12%, transparent)',
                    color: bid.status === 'closing_soon' ? 'var(--color-red)' : 'var(--color-green)',
                  }}>
                    {bid.status === 'closing_soon' ? t('Closing Soon') : t('Open')}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-1 rounded" style={{
                    background: 'var(--color-surface2)',
                    color: 'var(--color-muted)',
                    border: '1px solid var(--color-border)',
                  }}>
                    {bid.bid_source || bid.agency}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                  {bid.title}
                </h3>

                {bid.description && (
                  <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                    {bid.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--color-muted)' }}>
                  {bid.due_at && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(bid.due_at)}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'var(--color-green)' }}>
                    <DollarSign className="w-3.5 h-3.5" />
                    {formatValue(bid.estimated_value)}
                  </span>
                </div>
              </div>

              <div
                className="shrink-0 p-4 rounded-lg flex flex-col items-center justify-center min-w-[140px]"
                style={{ background: 'color-mix(in srgb, var(--color-red) 6%, var(--color-surface2))', border: '1px solid color-mix(in srgb, var(--color-red) 20%, var(--color-border))' }}
              >
                <Sparkles className="w-5 h-5 mb-1" style={{ color: 'var(--color-red)' }} />
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-red)' }}>
                  {t('AI Pitch Bid')}
                </span>
                <span className="text-[10px] mt-1 text-center" style={{ color: 'var(--color-muted)' }}>
                  {t('Generate proposal in seconds')}
                </span>
              </div>
            </div>
          </div>

          <div
            className="px-6 py-3 border-t flex items-center justify-center gap-2 transition-colors"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
              {t('View all')} {displayBids.length} {t('open bids')}
            </span>
            <ArrowRight className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
