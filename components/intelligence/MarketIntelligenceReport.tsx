'use client';

import React from 'react';
import { FileText, TrendingUp, Users, Zap, CheckCircle2, Globe, Phone, Mail } from 'lucide-react';
import { MarketReport } from '@/lib/market/reports';

interface MarketIntelligenceReportProps {
  report: MarketReport;
  onClose?: () => void;
}

export default function MarketIntelligenceReport({ report, onClose }: MarketIntelligenceReportProps) {
  return (
    <div className="result-panel">
      <div className="result-panel-header">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-accent" />
          <span className="result-panel-title">Market Intelligence Report: {report.name}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="result-panel-close">
            <Zap size={14} />
          </button>
        )}
      </div>
      
      <div className="result-panel-body">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--fg-muted)] text-[10px] font-bold uppercase tracking-wider mb-2">
              <Users size={12} />
              Total Companies
            </div>
            <div className="text-3xl font-extrabold text-[var(--fg)]">{report.totalCompanies}</div>
            <div className="text-[10px] text-[var(--fg-muted)] mt-1">Indexed on {report.searchDate}</div>
          </div>
          
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--fg-muted)] text-[10px] font-bold uppercase tracking-wider mb-2">
              <TrendingUp size={12} />
              Priority Tiers
            </div>
            <div className="flex items-baseline gap-4">
              <div>
                <span className="text-xs font-bold text-[var(--accent)]">A: </span>
                <span className="text-xl font-bold">{report.priorityA}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--fg-secondary)]">B: </span>
                <span className="text-xl font-bold">{report.priorityB}</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[var(--fg-muted)]">C: </span>
                <span className="text-xl font-bold">{report.priorityC}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--fg-muted)] text-[10px] font-bold uppercase tracking-wider mb-2">
              <Zap size={12} />
              Market Density
            </div>
            <div className="text-3xl font-extrabold text-[var(--fg)]">
              {report.totalCompanies > 0 ? Math.round((report.priorityA / report.totalCompanies) * 100) : 0}%
            </div>
            <div className="text-[10px] text-[var(--fg-muted)] mt-1">High-value local density</div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-muted)] flex items-center gap-2">
            <CheckCircle2 size={12} className="text-[var(--accent)]" />
            Data Enrichment Coverage
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CoverageItem icon={<Phone size={14} />} label="Phone" value={report.coverage.phone} />
            <CoverageItem icon={<Globe size={14} />} label="Website" value={report.coverage.website} />
            <CoverageItem icon={<Mail size={14} />} label="Email" value={report.coverage.email} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CoverageItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="relative overflow-hidden p-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--fg-secondary)]">
          {icon}
          {label}
        </div>
        <span className="text-xs font-bold text-[var(--fg)]">{value}%</span>
      </div>
      <div className="h-1 w-full bg-[var(--border)] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[var(--accent)] transition-all duration-1000 ease-out" 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
