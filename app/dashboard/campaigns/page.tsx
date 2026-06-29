'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Campaign {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setCampaigns(data);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Campaigns</h1>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-medium text-white">{c.name}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      c.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                      c.status === 'draft' ? 'bg-gray-800 text-gray-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>{c.status}</span>
                  </td>
                  <td className="py-3 text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {campaigns.length === 0 && (
                <tr><td colSpan={3} className="py-12 text-center text-gray-500 italic">No campaigns yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
