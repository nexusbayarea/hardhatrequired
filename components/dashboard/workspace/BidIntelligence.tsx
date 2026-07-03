'use client';

import { useState } from 'react';
import { Gavel, FileText, Upload, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function BidIntelligence() {
  const { t } = useLanguage();
  const [scopeInput, setScopeInput] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          {t('bid intelligence')}
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
          {t('scope analysis, cost breakdown, vendor recommendations, and proposal generation')}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Scope input */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
            <FileText className="w-4 h-4 inline mr-2" />{t('scope input')}
          </h3>

          <div className="space-y-3">
            <textarea
              value={scopeInput}
              onChange={e => setScopeInput(e.target.value)}
              placeholder={t('paste scope description, upload PDF, or describe the project...')}
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                <Upload className="w-4 h-4" /> {t('upload PDF')}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}>
                <Upload className="w-4 h-4" /> {t('upload plans')}
              </button>
              <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                {t('or type scope details above')}
              </span>
            </div>
          </div>

          <button
            disabled={!scopeInput.trim()}
            className="btn-primary w-full"
            style={{ opacity: scopeInput.trim() ? 1 : 0.4 }}
          >
            <Gavel className="w-5 h-5" /> {t('analyze scope')}
          </button>
        </div>

        {/* AI analysis output */}
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
            <TrendingUp className="w-4 h-4 inline mr-2" />{t('ai estimate')}
          </h3>

          <div
            className="p-5 rounded-xl space-y-3"
            style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              {t('enter a scope description above to generate an AI estimate.')}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1">
                <span style={{ color: 'var(--color-muted)' }}>{t('detected vertical')}</span>
                <span className="font-bold" style={{ color: 'var(--color-text)' }}>—</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: 'var(--color-muted)' }}>{t('estimated cost')}</span>
                <span className="font-bold font-mono" style={{ color: 'var(--color-yellow)' }}>—</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: 'var(--color-muted)' }}>{t('suggested bid range')}</span>
                <span className="font-bold font-mono" style={{ color: 'var(--color-green)' }}>—</span>
              </div>
              <div className="flex justify-between py-1">
                <span style={{ color: 'var(--color-muted)' }}>{t('risk score')}</span>
                <span className="font-bold" style={{ color: 'var(--color-text)' }}>—</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-4 rounded-lg text-center"
              style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
            >
              <DollarSign className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--color-green)' }} />
              <div className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{t('cost breakdown')}</div>
            </div>
            <div
              className="p-4 rounded-lg text-center"
              style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
            >
              <Gavel className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--color-yellow)' }} />
              <div className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{t('vendor recs')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
