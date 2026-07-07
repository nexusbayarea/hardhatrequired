import { NextRequest, NextResponse } from 'next/server';
import { supabaseFetch } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { routing_strategy, extraction_rules } = await request.json();
    const { id } = await params;

    const res = await supabaseFetch(`/rest/v1/vertical_registries?id=eq.${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        extraction_rules: {
          strategy: routing_strategy,
          schema: extraction_rules,
        },
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Database update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Schema updated.' });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
