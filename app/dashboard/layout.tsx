'use client';

import { ThemeProvider } from '@/components/shared/ThemeProvider';
import Sidebar from '@/components/dashboard/Sidebar';
import Topbar from '@/components/dashboard/Topbar';
import BottomActionBar from '@/components/dashboard/BottomActionBar';
import Link from 'next/link';
import { HardHat } from 'lucide-react';
import { SearchStateProvider } from '@/context/SearchStateContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { AgentForemanProvider } from '@/components/ai/agent-foreman-provider';

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  return (
    <SearchStateProvider>
      <WorkspaceProvider>
        <ProjectProvider>
            <AgentForemanProvider />
            <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
              {/* Desktop: sidebar + topbar */}
              <div className="hidden lg:flex">
                <Sidebar />
                <main className="flex-1 min-w-0 w-full overflow-x-hidden">
                  <Topbar />
                  <div className="p-8" style={{ zoom: 1.25 }}>{children}</div>
                </main>
              </div>

              {/* Tablet (md–lg): slim sidebar + topbar */}
              <div className="hidden md:flex lg:hidden">
                <Sidebar slim />
                <main className="flex-1 min-w-0 w-full overflow-x-hidden">
                  <Topbar />
                  <div className="p-6" style={{ zoom: 1.25 }}>{children}</div>
                </main>
              </div>

              {/* Mobile: top mini-bar + bottom action bar */}
              <div className="md:hidden flex flex-col min-h-screen">
                <header
                  className="h-16 px-4 border-b flex items-center justify-between shrink-0"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                >
                  <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--color-red)' }}
                    >
                      <HardHat className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="font-black text-2xl tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '-0.01em', color: 'var(--color-text)' }}>
                        HHR
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                        Hard Hat Required
                      </span>
                    </div>
                  </Link>
                  <Topbar mobile />
                </header>

                <main className="flex-1 overflow-x-hidden pb-20">
                  <div className="p-4" style={{ zoom: 1.25 }}>{children}</div>
                </main>

                <BottomActionBar />
              </div>
            </div>
        </ProjectProvider>
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
