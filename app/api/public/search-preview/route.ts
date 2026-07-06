import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch } from '@/lib/db';

export async function POST(_req: NextRequest) {
  try {
    const res = await supabaseFetch(
      "/rest/v1/deep_profiles?select=company_name,city,state,confidence_score,fit_type,updated_at&order=confidence_score.desc.nullslast&limit=8"
    );
    if (!res.ok) throw new Error(`Supabase responded ${res.status}`);
    const companies = await res.json();

    const preview = (companies || []).map((c: any) => ({
      company: c.company_name,
      city: c.city,
      state: c.state,
      confidence: c.confidence_score,
      fitType: c.fit_type,
    }));

    return NextResponse.json({ companies: preview });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
