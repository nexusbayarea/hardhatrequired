'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Folder, BookmarkCheck, Gavel, ShieldAlert, CalendarClock,
  ArrowRight, Plus, TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useProject } from '@/context/ProjectContext';

interface StatCard {
  icon: typeof Search;
  label: string;
  value: string;
  trend?: string;
  color: string;
}

interface ActivityItem {
  title: string;
  subtitle: string;
  time: string;
  type: 'search' | 'project' | 'bid' | 'vendor';
}

export default function CommandCenter() {
  const { t } = useLanguage();
  const { setWorkspace } = useWorkspace();
  const { projects, activeProject } = useProject();

  const [reportData, setReportData] = useState<{
    totalCompanies?: number;
    priorityA?: number;
    priorityB?: number;
    priorityC?: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Command Center Overview' }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setReportData(data);
      })
      .catch(() => {});
  }, []);

  const stats: StatCard[] = useMemo(() => [
    { icon: Search, label: 'open searches', value: reportData?.totalCompanies ? String(Math.ceil(reportData.totalCompanies / 4)) : String(projects.length || 0), trend: `${projects.length} projects`, color: 'var(--color-blue)' },
    { icon: Folder, label: 'active projects', value: String(projects.length), trend: activeProject ? `active: ${activeProject.name}` : '0 active', color: 'var(--color-indigo)' },
    { icon: BookmarkCheck, label: 'saved vendors', value: String(projects.reduce((sum, p) => sum + p.linkedVendors.length, 0)), trend: 'across projects', color: 'var(--color-green)' },
    { icon: Gavel, label: 'bid pipeline', value: reportData?.totalCompanies ? String(reportData.totalCompanies) : String(projects.length * 3), trend: `${reportData?.priorityA || 0} priority A`, color: 'var(--color-yellow)' },
    { icon: ShieldAlert, label: 'compliance alerts', value: '--', trend: 'live feed pending', color: 'var(--color-red)' },
    { icon: CalendarClock, label: 'permit expirations', value: '--', trend: 'live feed pending', color: 'var(--color-pink)' },
  ], [projects, activeProject, reportData]);

  const recentActivity: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    projects.slice(0, 4).forEach(p => {
      items.push({
        title: p.name,
        subtitle: `${p.vertical.replace(/_/g, ' ')} · ${p.volume.toLocaleString()} gal · ZIP ${p.zip}`,
        time: new Date(p.createdAt).toLocaleDateString(),
        type: 'project',
      });
    });
    if (items.length === 0) {
      items.push({
        title: 'No recent activity',
        subtitle: 'Create a project to get started',
        time: '',
        type: 'project',
      });
    }
    return items;
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          {t('command center')}
        </h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-muted)' }}>
          {t('construction market intelligence dashboard')}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 transition-all hover:translate-y-[-2px] cursor-pointer"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
            onClick={() => {
              if (s.label === 'open searches') setWorkspace('search');
              if (s.label === 'active projects') setWorkspace('projects');
              if (s.label === 'saved vendors') setWorkspace('saved-vendors');
              if (s.label === 'bid pipeline') setWorkspace('bids');
              if (s.label === 'compliance alerts') setWorkspace('market');
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `color-mix(in srgb, ${s.color} 12%, transparent)`, color: s.color }}
              >
                <s.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold font-mono" style={{ color: 'var(--color-text)' }}>
              {s.value}
            </div>
            <div className="text-[11px] font-semibold mt-1" style={{ color: 'var(--color-muted)' }}>
              {t(s.label)}
            </div>
            {s.trend && (
              <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--color-green)' }}>
                {s.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div
          className="rounded-xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text)' }}>
              {t('recent activity')}
            </h3>
            <button
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: 'var(--color-blue)' }}
            >
              {t('view all')} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:cursor-pointer"
                style={{ background: 'var(--color-surface2)' }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: a.type === 'search'
                      ? 'color-mix(in srgb, var(--color-blue) 12%, transparent)'
                      : a.type === 'bid'
                      ? 'color-mix(in srgb, var(--color-yellow) 12%, transparent)'
                      : a.type === 'project'
                      ? 'color-mix(in srgb, var(--color-indigo) 12%, transparent)'
                      : 'color-mix(in srgb, var(--color-green) 12%, transparent)',
                    color: a.type === 'search'
                      ? 'var(--color-blue)'
                      : a.type === 'bid'
                      ? 'var(--color-yellow)'
                      : a.type === 'project'
                      ? 'var(--color-indigo)'
                      : 'var(--color-green)',
                  }}
                >
                  {a.type === 'search' ? <Search className="w-4 h-4" /> :
                   a.type === 'bid' ? <Gavel className="w-4 h-4" /> :
                   a.type === 'project' ? <Folder className="w-4 h-4" /> :
                   <BookmarkCheck className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>
                    {a.title}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    {a.subtitle}
                  </div>
                </div>
                <div className="text-[10px] font-medium shrink-0 pt-0.5" style={{ color: 'var(--color-muted)' }}>
                  {a.time}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setWorkspace('search')}
            className="w-full mt-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
            style={{
              background: 'color-mix(in srgb, var(--color-blue) 10%, var(--color-surface2))',
              color: 'var(--color-blue)',
              border: '1px solid color-mix(in srgb, var(--color-blue) 20%, transparent)',
            }}
          >
            <Plus className="w-4 h-4" /> {t('new search')}
          </button>
        </div>

        {/* Quick Actions & Pipeline */}
        <div
          className="rounded-xl p-6"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--color-text)' }}>
            {t('quick actions')}
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => setWorkspace('search')}
              className="w-full p-4 rounded-lg flex items-center justify-between transition-colors group"
              style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5" style={{ color: 'var(--color-blue)' }} />
                <div className="text-left">
                  <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{t('search intelligence')}</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('find operators, facilities & equipment')}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            </button>
            <button
              onClick={() => setWorkspace('logistics')}
              className="w-full p-4 rounded-lg flex items-center justify-between transition-colors group"
              style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5" style={{ color: 'var(--color-green)' }} />
                <div className="text-left">
                  <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{t('logistics intelligence')}</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('route analysis, cost modeling & crew planning')}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            </button>
            <button
              onClick={() => setWorkspace('bids')}
              className="w-full p-4 rounded-lg flex items-center justify-between transition-colors group"
              style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <Gavel className="w-5 h-5" style={{ color: 'var(--color-yellow)' }} />
                <div className="text-left">
                  <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{t('bid intelligence')}</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('scope analysis, cost breakdown & proposal generation')}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            </button>
            <button
              onClick={() => setWorkspace('equipment')}
              className="w-full p-4 rounded-lg flex items-center justify-between transition-colors group"
              style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center gap-3">
                <Folder className="w-5 h-5" style={{ color: 'var(--color-indigo)' }} />
                <div className="text-left">
                  <div className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{t('equipment exchange')}</div>
                  <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('rental comparison, availability & rates')}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
            </button>
          </div>

          {/* Bid pipeline mini */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                {t('project pipeline')}
              </span>
            </div>
            <div className="space-y-2">
              {projects.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1.5">
                  <div>
                    <div className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{p.name}</div>
                    <div className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{p.vertical.replace(/_/g, ' ')} · {p.volume.toLocaleString()} gal</div>
                  </div>
                  <div className="text-xs font-bold font-mono" style={{ color: 'var(--color-yellow)' }}>${(p.contractRevenue || 0).toLocaleString()}</div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-xs" style={{ color: 'var(--color-muted)' }}>{t('create a project to see it here')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
