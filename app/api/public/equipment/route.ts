import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch } from '@/lib/db';

export async function POST(_req: NextRequest) {
  try {
    const res = await supabaseFetch(
      '/rest/v1/deep_profiles?select=company_name,city,state,equipment,updated_at&order=updated_at.desc&limit=20'
    );
    if (!res.ok) return NextResponse.json({ featured: [] });
    const rows = await res.json();

    const featured = (rows || [])
      .filter((r: any) => r.equipment && Array.isArray(r.equipment) && r.equipment.length > 0)
      .slice(0, 10)
      .map((r: any) => {
        const names = r.equipment
          .map((e: any) => typeof e === 'string' ? e : e.name || e.type || '')
          .filter(Boolean);
        return {
          company: r.company_name,
          equipment: names[0] || names[0] || 'Equipment available',
          city: r.city,
          availability: 'Today',
        };
      });

    return NextResponse.json({ featured });
  } catch {
    return NextResponse.json({ featured: [] });
  }
}
