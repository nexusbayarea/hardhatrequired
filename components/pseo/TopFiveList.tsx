import type { PseoVendor } from '@/lib/pseo/types';

function TrustBadge({ score }: { score: number }) {
  const color = score >= 0.8 ? 'green' : score >= 0.6 ? 'yellow' : 'default';
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded"
      style={{
        background: color === 'green' ? 'color-mix(in srgb, #22c55e 14%, transparent)' : color === 'yellow' ? 'color-mix(in srgb, #eab308 14%, transparent)' : 'color-mix(in srgb, var(--color-muted) 14%, transparent)',
        color: color === 'green' ? '#22c55e' : color === 'yellow' ? '#eab308' : 'var(--color-muted)',
      }}
    >
      {Math.round(score * 100)}%
    </span>
  );
}

function BadgeList({ badges }: { badges: string[] | null }) {
  if (!badges || badges.length === 0) return null;
  return (
    <div className="flex gap-1 flex-wrap">
      {badges.map(b => (
        <span
          key={b}
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{
            background: 'color-mix(in srgb, #a855f7 10%, transparent)',
            color: '#a855f7',
          }}
        >
          {b.replace(/_/g, ' ')}
        </span>
      ))}
    </div>
  );
}

interface Props {
  vendors: PseoVendor[];
}

export default function TopFiveList({ vendors }: Props) {
  if (vendors.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--color-muted)' }}>
        No vendors found for this area.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {vendors.map((v, i) => (
        <div
          key={v.id}
          className="flex items-center gap-4 p-4 rounded-xl border"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <span
            className="text-lg font-bold w-8 text-center shrink-0"
            style={{ color: 'var(--color-muted)' }}
          >
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>
              {v.company_name}
            </h3>
            <BadgeList badges={v.verified_badges} />
          </div>
          <TrustBadge score={v.trust_score} />
        </div>
      ))}
    </div>
  );
}
