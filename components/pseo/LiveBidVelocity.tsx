import type { PseoBid } from '@/lib/pseo/types';

interface Props {
  bids: PseoBid[] | null;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function LiveBidVelocity({ bids }: Props) {
  if (!bids || bids.length === 0) return null;

  return (
    <div className="rounded-xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
      <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
        Recent Regional Bid Activity
      </h2>
      <div className="space-y-3">
        {bids.map(b => (
          <div key={b.opp_id} className="flex items-center justify-between text-sm">
            <span className="truncate font-mono text-xs" style={{ color: 'var(--color-muted)' }}>
              {b.opp_id}
            </span>
            <span style={{ color: 'var(--color-text)' }}>{formatDate(b.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
