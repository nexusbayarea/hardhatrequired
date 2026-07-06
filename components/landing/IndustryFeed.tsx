'use client';

import { useState, useEffect } from 'react';
import { Loader, Newspaper } from 'lucide-react';

export default function IndustryFeed() {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    fetch('/api/public/news', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.news?.length) {
          setHasData(true);
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

        <div
          className="rounded-xl p-12 flex flex-col items-center justify-center text-center"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Newspaper className="w-8 h-8 mb-4" style={{ color: 'var(--color-muted)' }} />
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)' }}>
            Industry news feed coming soon
          </h3>
          <p className="text-sm max-w-md" style={{ color: 'var(--color-muted)' }}>
            We&apos;re building a live feed of regulatory updates, procurement notices, and industry intelligence
            sourced from federal and state agencies. Check back soon.
          </p>
        </div>
      </div>
    </section>
  );
}
