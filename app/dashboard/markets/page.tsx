'use client';

import MetricCard from '@/components/dashboard/MetricCard';

const markets = [
  { name: 'Industry Index', region: 'San Francisco Bay Area', companies: '1,247', campaigns: 4 },
  { name: 'Construction', region: 'Los Angeles Metro', companies: '892', campaigns: 2 },
  { name: 'Industrial', region: 'Central Valley', companies: '456', campaigns: 1 },
];

export default function MarketsPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold">Markets</h1>
        <p className="text-sm text-muted mt-1">Monitor your indexed markets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard label="Total Markets" value="48" change="+3 this month" positive />
        <MetricCard label="Active Markets" value="12" />
        <MetricCard label="Total Companies" value="2.4M" />
        <MetricCard label="Coverage Rate" value="84%" change="92% enriched" positive />
      </div>

      <div className="bg-surface rounded-3xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {['Market', 'Region', 'Companies', 'Campaigns', ''].map(h => (
                <th key={h} className="text-left text-[10px] font-semibold text-muted uppercase tracking-wider px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {markets.map((m) => (
              <tr key={m.name} className="border-b border-border hover:bg-surface2 transition-colors">
                <td className="px-4 py-3 text-sm font-semibold">{m.name}</td>
                <td className="px-4 py-3 text-sm text-muted">{m.region}</td>
                <td className="px-4 py-3 text-sm text-muted">{m.companies}</td>
                <td className="px-4 py-3 text-sm text-muted">{m.campaigns}</td>
                <td className="px-4 py-3">
                  <button className="text-xs text-red font-semibold hover:underline">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
