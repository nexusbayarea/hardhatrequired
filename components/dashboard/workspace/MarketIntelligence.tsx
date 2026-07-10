'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TrendingUp, Gavel, Newspaper, Shield, BarChart3 } from 'lucide-react';

interface FeedItem {
  title: string;
  subtitle: string;
}

interface Section {
  icon: typeof Gavel;
  label: string;
  color: string;
  items: FeedItem[];
}

export default function MarketIntelligence() {
  const { t } = useLanguage();
  const [sections, setSections] = useState<Section[]>([]);
  const [stats, setStats] = useState<{ icon: typeof Gavel; label: string; value: string; trend: string; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMarketData() {
      try {
        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Market Intelligence Overview' }),
        });
        if (res.ok) {
          const data = await res.json();
          const bidFeed: FeedItem[] = [];
          const newsFeed: FeedItem[] = [];
          const permitFeed: FeedItem[] = [];

          const totalCompanies = data.totalCompanies || 0;
          const priorityA = data.priorityA || 0;
          const priorityB = data.priorityB || 0;
          const priorityC = data.priorityC || 0;

          bidFeed.push({
            title: `${totalCompanies} Companies in Active Pipeline`,
            subtitle: `${priorityA} priority A · ${priorityB} priority B · ${priorityC} priority C`,
          });

          if (data.marketTrends?.length) {
            data.marketTrends.forEach((trend: string) => {
              newsFeed.push({ title: trend, subtitle: 'Market intelligence update' });
            });
          }

          permitFeed.push({
            title: `${data.activePermits || 0} Active Permits Tracked`,
            subtitle: 'Regulatory compliance monitoring',
          });

          const newSections: Section[] = [
            { icon: Gavel, label: 'bid feed', color: 'var(--color-yellow)', items: bidFeed },
            { icon: Newspaper, label: 'industry news', color: 'var(--color-blue)', items: newsFeed.length ? newsFeed : [{ title: 'Market data loading...', subtitle: 'Live feed from discovery pipeline' }] },
            { icon: Shield, label: 'permit activity', color: 'var(--color-purple)', items: permitFeed },
          ];
          setSections(newSections);

          setStats([
            { icon: Gavel, label: 'open leads', value: String(totalCompanies), trend: `${priorityA} priority A`, color: 'var(--color-yellow)' },
            { icon: Shield, label: 'active permits', value: String(data.activePermits || 0), trend: 'tracked', color: 'var(--color-purple)' },
            { icon: BarChart3, label: 'market activity', value: `${data.coverage?.phone || 0}%`, trend: 'phone coverage', color: 'var(--color-green)' },
            { icon: TrendingUp, label: 'web coverage', value: `${data.coverage?.website || 0}%`, trend: 'website coverage', color: 'var(--color-blue)' },
          ]);
        } else {
          throw new Error('API unavailable');
        }
      } catch {
        setStats([
          { icon: Gavel, label: 'open leads', value: '--', trend: 'connect to live pipeline', color: 'var(--color-yellow)' },
          { icon: Shield, label: 'active permits', value: '--', trend: 'connect to live pipeline', color: 'var(--color-purple)' },
          { icon: BarChart3, label: 'market activity', value: '--', trend: 'connect to live pipeline', color: 'var(--color-green)' },
          { icon: TrendingUp, label: 'web coverage', value: '--', trend: 'connect to live pipeline', color: 'var(--color-blue)' },
        ]);
        setSections([]);
      } finally {
        setLoading(false);
      }
    }
    loadMarketData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          {t('market intelligence')}
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
          {t('daily intelligence hub, bid feed, industry news, permit activity, and market trends')}
        </p>
      </div>

      {/* Trends summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label}
            className="rounded-xl p-4"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)`, color: s.color }}>
                <s.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text)' }}>{s.value}</div>
            <div className="text-[11px] font-semibold mt-1" style={{ color: 'var(--color-muted)' }}>{t(s.label)}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-green)' }}>{s.trend}</div>
          </div>
        ))}
      </div>

      {/* Feed sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {sections.length > 0 ? sections.map(section => (
          <div key={section.label}
            className="rounded-xl p-6"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${section.color} 12%, transparent)`, color: section.color }}>
                <section.icon className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
                {t(section.label)}
              </h3>
            </div>
            <div className="space-y-3">
              {section.items.map((item, i) => (
                <div key={i} className="p-3 rounded-lg transition-colors"
                  style={{ background: 'var(--color-surface2)' }}>
                  <div className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{item.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{item.subtitle}</div>
                </div>
              ))}
            </div>
          </div>
        )) : !loading && (
          <div className="col-span-3 rounded-xl p-12 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('market data unavailable — check API configuration')}</p>
          </div>
        )}
        {loading && (
          <div className="col-span-3 rounded-xl p-12 text-center" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{t('loading market data...')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
