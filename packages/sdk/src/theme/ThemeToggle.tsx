'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';

export interface ThemeToggleProps {
  theme: 'day' | 'night';
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ theme, onToggle, className = '' }: ThemeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-lg transition-colors hover:bg-slate-800 ${className}`}
      aria-label={`Switch to ${theme === 'night' ? 'day' : 'night'} mode`}
      type="button"
    >
      {theme === 'night' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-400" />
      )}
    </button>
  );
}
