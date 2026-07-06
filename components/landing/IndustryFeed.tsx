'use client';

import { useState, useEffect } from 'react';
import { FileText, ExternalLink, ArrowRight, Loader, Building2, Shield, Truck, Newspaper, Globe } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
  impact: 'High' | 'Medium' | 'Low';
  actionableTakeaway: string;
}

const FEED_ICONS: Record<string, any> = {
  'OSHA': Shield,
  'EPA': Globe,
  'DOT': Truck,
  'Utilities': Building2,
  'Local News': Newspaper,
};

export default function IndustryFeed() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'CA' }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && data?.news?.length) {
          setNews(data.news);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="py-24 md:py-36">
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 flex items-center justify-center p-12">
          <Loader className="w-6 h-6 animate-spin" style={{ color: 'var(--color-red)' }} />
        </div>
      </section>
    );
  }

  if (news.length === 0) return null;

  return (
    <section className="py-24 md:py-36">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="mb-12">
          <p className="section-label mb-4">industry intelligence</p>
          <h2 className="text-section" style={{ color: 'var(--color-text)' }}>
            what moves your market.<br />
            <span style={{ color: 'var(--color-muted)' }}>delivered daily.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((item) => {
            const Icon = FEED_ICONS[item.source] || FileText;
            return (
              <div
                key={item.id}
                className="group p-5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'color-mix(in srgb, var(--color-red) 10%, var(--color-surface2))' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: 'var(--color-red)' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                        {item.source}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          item.impact === 'High' ? 'text-red' : 'text-muted'
                        }`}
                        style={{
                          background: item.impact === 'High'
                            ? 'color-mix(in srgb, var(--color-red) 12%, transparent)'
                            : 'var(--color-surface2)',
                        }}
                      >
                        {item.impact} Impact
                      </span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug" style={{ color: 'var(--color-text)' }}>
                      {item.title}
                    </h3>
                  </div>
                </div>

                <p className="text-xs mb-4 line-clamp-2" style={{ color: 'var(--color-muted)' }}>
                  {item.summary}
                </p>

                <div
                  className="p-3 rounded-lg transition-colors"
                  style={{
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--color-red)' }}>
                    Actionable Advice
                  </span>
                  <p className="text-xs italic" style={{ color: 'var(--color-muted)' }}>
                    &ldquo;{item.actionableTakeaway}&rdquo;
                  </p>
                </div>

                <div className="mt-3 text-[11px]" style={{ color: 'var(--color-muted)' }}>
                  {item.publishedAt}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
