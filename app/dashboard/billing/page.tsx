'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const PLANS = [
  { id: 'starter', name: 'Starter', price: 49, searches: 50, contacts: 1000 },
  { id: 'growth', name: 'Growth', price: 149, searches: 200, contacts: 5000 },
  { id: 'enterprise', name: 'Enterprise', price: 499, searches: 'Unlimited', contacts: 'Unlimited' },
];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadBilling();
  }, []);

  const loadBilling = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: org } = await supabase.from('organization_users').select('organization_id').eq('user_id', user.id).single();
    if (!org) { setLoading(false); return; }

    const { data: sub } = await supabase.from('subscriptions').select('*').eq('organization_id', org.organization_id).single();
    if (sub) setSubscription(sub);

    const monthStart = new Date();
    monthStart.setDate(1);
    const { data: events } = await supabase
      .from('usage_events')
      .select('event_type, quantity')
      .eq('organization_id', org.organization_id)
      .gte('created_at', monthStart.toISOString());
    if (events) setUsage(events);
    setLoading(false);
  };

  const totalSearches = usage?.filter((e: any) => e.event_type === 'search').reduce((s: number, e: any) => s + e.quantity, 0) || 0;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-6">Billing</h1>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="space-y-6">
          {subscription && (
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-5">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Current Plan</span>
              <div className="text-lg font-bold text-white mt-1 capitalize">{subscription.plan}</div>
              <div className="text-xs text-gray-500 mt-1">Status: {subscription.status}</div>
              <div className="mt-3 text-xs text-gray-400">Searches this month: {totalSearches}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`bg-[#111] border rounded-2xl p-5 ${
                  subscription?.plan === plan.id ? 'border-[#dc2626]' : 'border-gray-800'
                }`}
              >
                <div className="text-sm font-bold text-white">{plan.name}</div>
                <div className="text-2xl font-bold text-white mt-2">${plan.price}<span className="text-xs text-gray-400 font-normal">/mo</span></div>
                <ul className="mt-4 space-y-2 text-xs text-gray-400">
                  <li>{plan.searches} searches/mo</li>
                  <li>{plan.contacts} contacts/mo</li>
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
