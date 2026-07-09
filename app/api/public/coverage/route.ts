import { NextRequest, NextResponse } from 'next/server';
import { supabaseRpc } from '@/lib/db';

export async function POST(_req: NextRequest) {
  try {
    const res = await supabaseRpc('get_public_coverage');
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({});
  } catch {
    return NextResponse.json({});
  }
}
