'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
    const { count: contactCount } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
    const { count: campaignCount } = await supabase.from('campaigns').select('*', { count: 'exact', head: true });
    const { count: outreachCount } = await supabase.from('outreach_logs').select('*', { count: 'exact', head: true });

    setMetrics({
      companies: companyCount || 0,
      contacts: contactCount || 0,
      campaigns: campaignCount || 0,
      outreach: outreachCount || 0,
    });
    setLoading(false);
  };

  const cards = metrics ? [
    { label: 'Companies', value: metrics.companies, color: 'border-blue-500/20 text-blue-400' },
    { label: 'Contacts', value: metrics.contacts, color: 'border-emerald-500/20 text-emerald-400' },
    { label: 'Campaigns', value: metrics.campaigns, color: 'border-purple-500/20 text-purple-400' },
    { label: 'Outreach Logs', value: metrics.outreach, color: 'border-amber-500/20 text-amber-400' },
  ] : [];

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Reports</h1>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.label} className={`bg-[#111] border ${card.color} rounded-2xl p-5`}>
              <div className="text-3xl font-bold">{card.value}</div>
              <div className="mt-1 text-xs opacity-60">{card.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
