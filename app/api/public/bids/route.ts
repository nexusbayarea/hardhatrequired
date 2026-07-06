import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch } from '@/lib/db';

export async function POST(_req: NextRequest) {
  try {
    const res = await supabaseFetch(
      "/rest/v1/bid_results?select=id,title,agency,estimated_value,due_at,state,city,bid_source,status,description,created_at&status=in.(open,closing_soon)&order=due_at.asc&limit=10"
    );
    if (!res.ok) throw new Error(`Supabase responded ${res.status}`);
    const bids = await res.json();
    return NextResponse.json({ bids: bids || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
