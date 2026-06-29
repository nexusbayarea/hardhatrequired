'use client';

import { HardHat, LayoutDashboard, Search, TrendingUp, Layers, Phone, BarChart3, CreditCard, Settings, Shield } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/shared/ThemeToggle';

const navItems = [
  {
    section: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Overview',  href: '/dashboard' },
      { icon: Search,          label: 'Search',    href: '/dashboard/search' },
      { icon: TrendingUp,      label: 'Markets',   href: '/dashboard/markets' },
    ],
  },
  {
    section: 'SALES',
    items: [
      { icon: Layers,   label: 'Campaigns', href: '/dashboard/campaigns' },
      { icon: Phone,    label: 'Outreach',  href: '/login' },
      { icon: BarChart3,label: 'Reports',   href: '/dashboard/reports' },
    ],
  },
  {
    section: 'ADMIN',
    items: [
      { icon: CreditCard, label: 'Billing',  href: '/dashboard/billing' },
      { icon: Settings,   label: 'Settings', href: '/dashboard/settings' },
      { icon: Shield,     label: 'Admin',    href: '/dashboard/admin' },
    ],
  },
];

interface SidebarProps {
  slim?: boolean;
}

export default function Sidebar({ slim = false }: SidebarProps) {
  const pathname = usePathname();

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
                {group.section}
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
                        {item.label}
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
              Growth Plan
            </div>
            <div
              className="font-bold"
              style={{ fontSize: '1.0625rem', color: 'var(--color-text)' }}
            >
              Credits
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
