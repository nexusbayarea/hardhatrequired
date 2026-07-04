'use client';

import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-sm font-semibold"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid color-mix(in srgb, var(--color-green) 30%, var(--color-border))',
          color: 'var(--color-green)',
        }}
      >
        <CheckCircle className="w-4 h-4" />
        {message}
      </div>
    </div>
  );
}
