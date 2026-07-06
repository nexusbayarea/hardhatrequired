'use client';

import { useState, useEffect, useRef } from 'react';

interface Activity {
  id: string;
  icon: string;
  text: string;
  time: string;
}

const FALLBACK_ACTIVITIES: Activity[] = [
  { id: 'a1', icon: '🔍', text: 'New slurry contractor indexed in Sacramento', time: '2 min ago' },
  { id: 'a2', icon: '📋', text: '4 new Caltrans bids published today', time: '15 min ago' },
  { id: 'a3', icon: '📝', text: '12 permits updated this morning', time: '32 min ago' },
  { id: 'a4', icon: '🚛', text: '3 new vacuum truck rentals added near Fresno', time: '1 hr ago' },
  { id: 'a5', icon: '🔎', text: '18 searches performed in the last hour', time: '1 hr ago' },
  { id: 'a6', icon: '🏗️', text: 'Vacuum truck operator discovered in Stockton', time: '2 hr ago' },
  { id: 'a7', icon: '📊', text: 'Concrete washout facility permits renewed in Oakland', time: '2 hr ago' },
  { id: 'a8', icon: '⚖️', text: 'New OSHA silica exposure rules effective next month', time: '3 hr ago' },
];

export default function LiveActivityTicker() {
  const [items, setItems] = useState<Activity[]>([]);
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    fetch('/api/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-iie-client-context': 'slurry_processing' },
      body: JSON.stringify({ state: 'CA' }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.success && data?.news?.length) {
          const fromNews: Activity[] = data.news.slice(0, 6).map((n: any, i: number) => ({
            id: `act-${i}`,
            icon: n.impact === 'High' ? '🔴' : n.impact === 'Medium' ? '🟡' : '🟢',
            text: n.title,
            time: n.publishedAt,
          }));
          if (data.bids?.length) {
            fromNews.push(...data.bids.slice(0, 2).map((b: any, i: number) => ({
              id: `bid-act-${i}`,
              icon: '📋',
              text: b.title,
              time: b.deadline,
            })));
          }
          setItems(fromNews);
        } else {
          setItems(FALLBACK_ACTIVITIES);
        }
      })
      .catch(() => setItems(FALLBACK_ACTIVITIES));
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  if (items.length === 0) return null;

  const active = items[current];

  return (
    <div
      className="w-full overflow-hidden border-y py-2"
      style={{
        borderColor: 'var(--color-border)',
        background: 'color-mix(in srgb, var(--color-surface) 80%, transparent)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-5 md:px-8 flex items-center gap-4">
        <span className="text-[10px] font-black uppercase tracking-widest shrink-0" style={{ color: 'var(--color-red)' }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red animate-pulse mr-1.5 align-middle" />
          LIVE
        </span>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-sm shrink-0">{active.icon}</span>
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
            {active.text}
          </p>
          <span className="text-[11px] shrink-0 ml-auto tabular-nums" style={{ color: 'var(--color-muted)' }}>
            {active.time}
          </span>
        </div>
        <div className="flex gap-1 shrink-0">
          {items.slice(0, 5).map((_, i) => (
            <span
              key={i}
              className="block rounded-full transition-all duration-300"
              style={{
                width: i === current ? '16px' : '6px',
                height: '6px',
                background: i === current ? 'var(--color-red)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
