import { Loader2 } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export default function MetricCard({ label, value, change, positive }: MetricCardProps) {
  return (
    <div
      className="p-6 md:p-8 rounded-xl transition-all"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Label — uppercase, bold, small but clear */}
      <div
        className="text-xs font-black uppercase tracking-widest mb-3"
        style={{ color: 'var(--color-muted)' }}
      >
        {label}
      </div>

      {/* Value — huge, reads from across the room */}
      <div
        className="font-black leading-none mb-2"
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
          letterSpacing: '-0.02em',
          color: 'var(--color-text)',
        }}
      >
        {value}
      </div>

      {/* Change indicator */}
      {change && (
        <div
          className="text-sm font-semibold"
          style={{ color: positive ? 'var(--color-green)' : 'var(--color-muted)' }}
        >
          {positive && '↑ '}{change}
        </div>
      )}
    </div>
  );
}

export function MetricCardLoading() {
  return (
    <div
      className="p-6 md:p-8 rounded-xl flex items-center justify-center min-h-[140px]"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <Loader2
        className="w-6 h-6 animate-spin"
        style={{ color: 'var(--color-muted)' }}
      />
    </div>
  );
}
