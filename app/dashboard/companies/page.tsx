'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  company_name: string;
  industry: string;
  city: string;
  state: string;
  priority: string;
  score: number;
  status: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data } = await supabase
      .from('companies')
      .select('*')
      .order('score', { ascending: false });
    if (data) setCompanies(data);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Companies</h1>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Industry</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Priority</th>
                <th className="pb-3 font-medium">Score</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-gray-300">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 font-medium text-white">{c.company_name}</td>
                  <td className="py-3">{c.industry}</td>
                  <td className="py-3">{c.city}, {c.state}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      c.priority === 'A' ? 'bg-emerald-500/20 text-emerald-400' :
                      c.priority === 'B' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>{c.priority || 'C'}</span>
                  </td>
                  <td className="py-3 font-mono">{c.score}</td>
                  <td className="py-3">{c.status}</td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-500 italic">No companies found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
