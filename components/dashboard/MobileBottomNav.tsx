'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LayoutDashboard, Search, TrendingUp, Layers, Phone, Settings } from 'lucide-react';

const items = [
  { icon: LayoutDashboard, label: 'overview', href: '/dashboard' },
  { icon: Search,          label: 'search',   href: '/dashboard/search' },
  { icon: TrendingUp,      label: 'markets',  href: '/dashboard/markets' },
  { icon: Layers,          label: 'campaigns',href: '/dashboard/campaigns' },
  { icon: Phone,           label: 'outreach', href: '/dashboard/outreach' },
  { icon: Settings,        label: 'settings', href: '/dashboard/settings' },
];

export default function MobileBottomNav() {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <nav className="mobile-nav">
      {items.map(({ icon: Icon, label, href }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={`mobile-nav-item ${active ? 'active' : ''}`}
            aria-label={label}
          >
            <Icon
              className="w-6 h-6"
              strokeWidth={active ? 2.5 : 1.8}
              style={{ color: active ? 'var(--color-red)' : 'var(--color-muted)' }}
            />
            <span style={{ color: active ? 'var(--color-red)' : 'var(--color-muted)' }}>
              {t(label)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
