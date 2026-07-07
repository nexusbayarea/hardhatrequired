'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface Activity {
  id: string;
  icon: string;
  text: string;
  time: string;
}

export default function LiveActivityTicker() {
  const { t } = useLanguage();
  const [items, setItems] = useState<Activity[]>([]);
  const [current, setCurrent] = useState(0);
  const [hasData, setHasData] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    fetch('/api/public/activity', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.items?.length) {
          setItems(data.items);
          setHasData(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % items.length);
    }, 4000);
    return () => window.clearInterval(timerRef.current!);
  }, [items.length]);

  if (!hasData || items.length === 0) return null;

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
          {t('LIVE')}
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
