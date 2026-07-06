import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch } from '@/lib/db';

export async function POST(_req: NextRequest) {
  try {
    const res = await supabaseFetch(
      "/rest/v1/regulatory_facilities?select=facility_name,city,county,permit_status,regulatory_status,vertical,confidence,imported_at&order=imported_at.desc&limit=5"
    );
    if (!res.ok) throw new Error(`Supabase responded ${res.status}`);
    const alerts = await res.json();
    return NextResponse.json({ alerts: alerts || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
