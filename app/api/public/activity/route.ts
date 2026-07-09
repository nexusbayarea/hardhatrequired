import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch } from '@/lib/db';

export async function POST(_req: NextRequest) {
  try {
    const [companiesRes, bidsRes, equipmentRes] = await Promise.all([
      supabaseFetch("/rest/v1/deep_profiles?select=company_name,city,updated_at&order=updated_at.desc&limit=5"),
      supabaseFetch("/rest/v1/bid_results?select=title,agency,city,created_at&order=created_at.desc&limit=3"),
      supabaseFetch("/rest/v1/deep_profiles?select=company_name,city,updated_at&order=updated_at.desc&limit=5"),
    ]);

    const [companies, bids, equipment] = await Promise.all([
      companiesRes.ok ? companiesRes.json() : [],
      bidsRes.ok ? bidsRes.json() : [],
      equipmentRes.ok ? equipmentRes.json() : [],
    ]);

    const now = new Date();
    const fmt = (d: string) => {
      if (!d) return '';
      const mins = Math.round((now.getTime() - new Date(d).getTime()) / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins} min ago`;
      const hrs = Math.floor(mins / 60);
      return hrs === 1 ? '1 hr ago' : `${hrs} hrs ago`;
    };

    const items: { id: string; icon: string; text: string; time: string }[] = [];

    (companies || []).forEach((c: any, i: number) => {
      if (c.company_name) {
        items.push({
          id: `company-indexed-${i}`,
          icon: '🔍',
          text: `${c.company_name} indexed in ${c.city || 'California'}`,
          time: fmt(c.updated_at),
        });
      }
    });

    (bids || []).forEach((b: any, i: number) => {
      if (b.title) {
        items.push({
          id: `bid-${i}`,
          icon: '📋',
          text: `${b.title}`,
          time: fmt(b.created_at),
        });
      }
    });

    (equipment || []).slice(0, 2).forEach((e: any, i: number) => {
      if (e.company_name) {
        items.push({
          id: `equipment-${i}`,
          icon: '🚛',
          text: `Equipment synced for ${e.company_name}`,
          time: fmt(e.updated_at),
        });
      }
    });

    return NextResponse.json({ items: items.slice(0, 8) });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
