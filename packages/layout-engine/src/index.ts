import type { DeviceType } from '@iie/sdk';

export type { DeviceType };

export const BREAKPOINTS = {
  phone: 640,
  tablet: 1024,
} as const;

export function detectDevice(width: number): DeviceType {
  if (width < BREAKPOINTS.phone) return 'phone';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

export function isPhone(width: number): boolean {
  return width < BREAKPOINTS.phone;
}

export function isTablet(width: number): boolean {
  return width >= BREAKPOINTS.phone && width < BREAKPOINTS.tablet;
}

export function isDesktop(width: number): boolean {
  return width >= BREAKPOINTS.tablet;
}

export function responsiveValue<T>(device: DeviceType, phone: T, tablet: T, desktop: T): T {
  if (device === 'phone') return phone;
  if (device === 'tablet') return tablet;
  return desktop;
}

export interface LayoutConfig {
  sidebar: {
    width: number;
    collapsedWidth: number;
    collapsible: boolean;
  };
  topbar: {
    height: number;
    sticky: boolean;
  };
  bottomNav: {
    height: number;
    visible: boolean;
  };
  content: {
    maxWidth: number;
    padding: number;
    zoom: number;
  };
}

export const LAYOUTS: Record<DeviceType, LayoutConfig> = {
  phone: {
    sidebar: { width: 0, collapsedWidth: 0, collapsible: false },
    topbar: { height: 56, sticky: true },
    bottomNav: { height: 64, visible: true },
    content: { maxWidth: 640, padding: 16, zoom: 1 },
  },
  tablet: {
    sidebar: { width: 240, collapsedWidth: 64, collapsible: true },
    topbar: { height: 64, sticky: true },
    bottomNav: { height: 0, visible: false },
    content: { maxWidth: 1024, padding: 24, zoom: 1.15 },
  },
  desktop: {
    sidebar: { width: 280, collapsedWidth: 72, collapsible: true },
    topbar: { height: 72, sticky: false },
    bottomNav: { height: 0, visible: false },
    content: { maxWidth: 1400, padding: 32, zoom: 1.25 },
  },
};
