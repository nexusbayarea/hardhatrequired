'use client';

import { HardHat, LayoutDashboard, Search, TrendingUp, Layers, Phone, BarChart3, CreditCard, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import ThemeToggle from '@/components/shared/ThemeToggle';

const navItems = [
  {
    section: 'main',
    items: [
      { icon: LayoutDashboard, label: 'overview',  href: '/dashboard' },
      { icon: Search,          label: 'search',    href: '/dashboard/search' },
      { icon: TrendingUp,      label: 'markets',   href: '/dashboard/markets' },
    ],
  },
  {
    section: 'sales',
    items: [
      { icon: Layers,   label: 'campaigns', href: '/dashboard/campaigns' },
      { icon: Phone,    label: 'outreach',  href: '/login' },
      { icon: BarChart3,label: 'reports',   href: '/dashboard/reports' },
    ],
  },
  {
    section: 'admin section',
    items: [
      { icon: CreditCard, label: 'billing',  href: '/dashboard/billing' },
      { icon: Settings,   label: 'settings', href: '/dashboard/settings' },
      { icon: Shield,     label: 'admin',    href: '/dashboard/admin' },
    ],
  },
];

interface SidebarProps {
  slim?: boolean;
}

export default function Sidebar({ slim = false }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside
      className={`shrink-0 min-h-screen flex flex-col border-r transition-all duration-200`}
      style={{
        width: slim ? '72px' : '280px',
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo */}
      <div
        className="h-20 flex items-center justify-center gap-3 border-b shrink-0 px-4"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-red)' }}
          >
            <HardHat className="w-5 h-5 text-white" />
          </div>
          {!slim && (
            <span
              className="font-black text-lg leading-none"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '-0.01em',
                color: 'var(--color-text)',
              }}
            >
              HHR
            </span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navItems.map((group) => (
          <div key={group.section}>
            {!slim && (
              <div
                className="px-4 mb-2 text-[10px] font-black uppercase tracking-widest"
                style={{ color: 'var(--color-muted)' }}
              >
                {t(group.section)}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={slim ? item.label : undefined}
                    className={`nav-item ${active ? 'active' : ''} ${slim ? 'justify-center px-0' : ''}`}
                    style={slim ? { borderLeft: 'none', borderRadius: '8px' } : {}}
                  >
                    <item.icon
                      className="shrink-0"
                      style={{
                        width: '22px',
                        height: '22px',
                        color: active ? 'var(--color-red)' : 'var(--color-muted)',
                        strokeWidth: active ? 2.5 : 1.8,
                      }}
                    />
                    {!slim && (
                      <span
                        style={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: active ? 'var(--color-red)' : undefined,
                        }}
                      >
                        {t(item.label)}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: theme toggle + plan info */}
      <div
        className="px-2 py-4 border-t shrink-0 space-y-3"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {!slim && (
          <div
            className="px-4 py-4 rounded-xl"
            style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
          >
            <div
              className="text-xs font-black uppercase tracking-wider mb-1"
              style={{ color: 'var(--color-muted)' }}
            >
              {t('growth plan')}
            </div>
            <div
              className="font-bold"
              style={{ fontSize: '1.0625rem', color: 'var(--color-text)' }}
            >
              {t('credits')}
            </div>
          </div>
        )}
        <div className={`flex ${slim ? 'justify-center' : 'px-2'}`}>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
