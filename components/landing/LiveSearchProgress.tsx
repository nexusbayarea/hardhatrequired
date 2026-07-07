'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, FileCheck, Network, BarChart3, CheckCircle2, Loader, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const STAGES = [
  { id: 'google', label: 'Google Places', icon: MapPin },
  { id: 'tomtom', label: 'TomTom', icon: Search },
  { id: 'regulatory', label: 'Regulatory', icon: FileCheck },
  { id: 'ontology', label: 'Ontology', icon: Network },
  { id: 'scoring', label: 'Scoring', icon: BarChart3 },
];

export default function LiveSearchProgress() {
  const { t } = useLanguage();
  const [activeStage, setActiveStage] = useState(-1);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (activeStage === -1) {
      const t = setTimeout(() => setActiveStage(0), 1500);
      return () => clearTimeout(t);
    }
    if (activeStage < STAGES.length - 1) {
      const t = setTimeout(() => setActiveStage(prev => prev + 1), 1000 + activeStage * 200);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCompleted(true), 800);
    return () => clearTimeout(t);
  }, [activeStage]);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div
        className="px-5 py-3 border-b flex items-center gap-2"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface2)' }}
      >
        {completed ? (
          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-green)' }} />
        ) : (
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-red)' }} />
        )}
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
          {completed ? t('search complete') : t('searching in progress...')}
        </span>
      </div>

      <div className="p-5">
        <div className="space-y-2">
          {STAGES.map((stage, i) => {
            const isActive = i === activeStage;
            const isDone = i < activeStage || completed;
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300"
                style={{
                  background: isActive ? 'color-mix(in srgb, var(--color-red) 8%, var(--color-surface2))' : 'transparent',
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: isDone ? 'var(--color-green)' : isActive ? 'var(--color-red)' : 'var(--color-surface2)',
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  ) : isActive ? (
                    <Loader className="w-3 h-3 text-white animate-spin" />
                  ) : (
                    <Icon className="w-3 h-3" style={{ color: 'var(--color-muted)' }} />
                  )}
                </div>
                <span
                  className="text-xs font-semibold transition-all duration-300"
                  style={{
                    color: isDone ? 'var(--color-green)' : isActive ? 'var(--color-text)' : 'var(--color-muted)',
                  }}
                >
                  {t(stage.label)}
                </span>
                {isActive && (
                  <span className="text-[10px] ml-auto animate-pulse" style={{ color: 'var(--color-muted)' }}>
                    {t('Searching...')}
                  </span>
                )}
                {isDone && !isActive && (
                  <span className="text-[10px] ml-auto" style={{ color: 'var(--color-green)' }}>
                    ✓ {t('Done')}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {completed && (
          <div
            className="mt-4 p-3 rounded-lg flex items-center justify-between transition-all animate-slide-down"
            style={{
              background: 'color-mix(in srgb, var(--color-green) 8%, var(--color-surface2))',
              border: '1px solid color-mix(in srgb, var(--color-green) 20%, var(--color-border))',
            }}
          >
            <div>
              <span className="text-xs font-bold" style={{ color: 'var(--color-green)' }}>
                {t('12 vendors discovered')}
              </span>
              <span className="text-[10px] ml-2" style={{ color: 'var(--color-muted)' }}>
                {t('within 50 mi radius')}
              </span>
            </div>
            <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-green)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
