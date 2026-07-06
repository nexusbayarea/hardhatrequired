import { NextRequest, NextResponse } from 'next/server';
import { supabaseRpc } from '@/lib/db';

export async function POST(_req: NextRequest) {
  try {
    const res = await supabaseRpc('get_public_coverage');
    if (!res.ok) throw new Error(`Supabase responded ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
