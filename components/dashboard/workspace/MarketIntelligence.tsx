'use client';

import { useLanguage } from '@/context/LanguageContext';
import { TrendingUp, Gavel, Newspaper, Shield, BarChart3 } from 'lucide-react';

export default function MarketIntelligence() {
  const { t } = useLanguage();

  const sections = [
    {
      icon: Gavel, label: 'bid feed', color: 'var(--color-yellow)',
      items: [
        { title: 'I-880 Pavement Grind — Fremont', subtitle: '35k gal slurry · Due Jul 20 · Est. $24,500' },
        { title: 'Alviso Slough Channel Boring', subtitle: 'Bentonite mud extraction · Due Jul 28 · Est. $18,200' },
        { title: 'San Leandro Dewatering Ops', subtitle: '15k gal · Due Aug 5 · Est. $31,000' },
      ],
    },
    {
      icon: Newspaper, label: 'industry news', color: 'var(--color-blue)',
      items: [
        { title: 'CARB Tightens Diesel Regulations', subtitle: 'New fleet compliance rules effective Q3 2026' },
        { title: 'Bay Area Concrete Demand +12% YoY', subtitle: 'Driven by infrastructure spending bill' },
        { title: 'Slurry Recycling Technology Advances', subtitle: 'New separation tech reduces disposal costs by 30%' },
      ],
    },
    {
      icon: Shield, label: 'permit activity', color: 'var(--color-purple)',
      items: [
        { title: '3 New Disposal Permits Issued', subtitle: 'Alameda County — slurry & wastewater' },
        { title: 'NPDES Stormwater Audit Underway', subtitle: 'EPA inspecting Alameda county records' },
        { title: '2 Facilities Nearing Capacity', subtitle: 'San Jose & Hayward — plan alternative routing' },
      ],
    },
  ];

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
        {[
          { icon: Gavel, label: 'open bids', value: '18', trend: '+3 today', color: 'var(--color-yellow)' },
          { icon: Shield, label: 'new permits', value: '4', trend: 'this week', color: 'var(--color-purple)' },
          { icon: BarChart3, label: 'market activity', value: '+12%', trend: 'concrete demand', color: 'var(--color-green)' },
          { icon: TrendingUp, label: 'avg bid value', value: '$22.4k', trend: '+5% MoM', color: 'var(--color-blue)' },
        ].map(s => (
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
            <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--color-green)' }}>{s.trend}</div>
          </div>
        ))}
      </div>

      {/* Feed sections */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {sections.map(section => (
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
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-muted)' }}>{item.subtitle}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
