'use client';

import { ThemeProvider } from '@/components/shared/ThemeProvider';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import MobileBottomNav from '@/components/dashboard/MobileBottomNav';
import Link from 'next/link';
import { HardHat } from 'lucide-react';
import { SearchStateProvider } from '@/context/SearchStateContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <SearchStateProvider>
      <WorkspaceProvider>
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        {/* Desktop: sidebar + topbar */}
        <div className="hidden lg:flex">
          <Sidebar />
          <main className="flex-1 min-w-0 w-full overflow-x-hidden">
            <Topbar />
            <div className="p-8">{children}</div>
          </main>
        </div>

        {/* Tablet (md–lg): slim sidebar + topbar */}
        <div className="hidden md:flex lg:hidden">
          <Sidebar slim />
          <main className="flex-1 min-w-0 w-full overflow-x-hidden">
            <Topbar />
            <div className="p-6">{children}</div>
          </main>
        </div>

        {/* Mobile: top mini-bar + bottom nav */}
        <div className="md:hidden flex flex-col min-h-screen">
          <header
            className="h-16 px-4 border-b flex items-center justify-between shrink-0"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--color-red)' }}
              >
                <HardHat className="w-4 h-4 text-white" />
              </div>
              <span
                className="font-black text-base"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '-0.01em', color: 'var(--color-text)' }}
              >
                HHR
              </span>
            </Link>
            <Topbar mobile />
          </header>

          <main className="flex-1 overflow-x-hidden pb-20">
            <div className="p-4">{children}</div>
          </main>

          <MobileBottomNav />
        </div>
      </div>
      </WorkspaceProvider>
    </SearchStateProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ThemeProvider>
  );
}
