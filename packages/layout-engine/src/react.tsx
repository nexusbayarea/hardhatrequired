'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { detectDevice, LAYOUTS } from './index';
import type { DeviceType, LayoutConfig } from './index';

export type { DeviceType, LayoutConfig };

export interface LayoutContextType {
  device: DeviceType;
  width: number;
  height: number;
  config: LayoutConfig;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [height, setHeight] = useState(() => typeof window !== 'undefined' ? window.innerHeight : 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const device = detectDevice(width);
  const config = LAYOUTS[device];

  const value: LayoutContextType = {
    device,
    width,
    height,
    config,
    sidebarCollapsed,
    setSidebarCollapsed,
    isPhone: device === 'phone',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextType {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error('useLayout must be used within LayoutProvider');
  return ctx;
}

export function withLayout<P extends object>(
  Component: React.ComponentType<P & { layout: LayoutContextType }>
): React.FC<P> {
  return function WrappedComponent(props: P) {
    const layout = useLayout();
    return <Component {...props} layout={layout} />;
  };
}
