'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { theme, toggle } = useTheme();
  const isDay = theme === 'day';

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      aria-label={isDay ? 'Switch to Night Mode' : 'Switch to Day Mode'}
      title={isDay ? 'Switch to Night Mode (dark, for night crews)' : 'Switch to Day Mode (bright sun / outdoor)'}
    >
      <div className="theme-toggle-knob">
        {isDay ? <Moon size={12} strokeWidth={2.5} /> : <Sun size={12} strokeWidth={2.5} />}
      </div>
    </button>
  );
}
