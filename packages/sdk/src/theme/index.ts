export type Theme = 'day' | 'night';

const THEME_KEY = 'iie-theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'night';
  return (localStorage.getItem(THEME_KEY) as Theme) || 'night';
}

export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('night', theme === 'night');
  document.documentElement.classList.toggle('day', theme === 'day');
}

export function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'night';
  const stored = getStoredTheme();
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'night';
}
