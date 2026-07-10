import { NextRequest, NextResponse } from 'next/server';
import { supabaseRpc, supabaseFetch } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { EquipmentRentalSearchRequest, EquipmentRentalResult, EquipmentRentalSearchResponse } from '@iie/sdk';

export async function POST(req: NextRequest) {
  const start = Date.now();

  let body: EquipmentRentalSearchRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    latitude,
    longitude,
    radius_miles = 25,
    equipment_class,
    target_date,
  } = body;

  if (latitude == null || longitude == null) {
    return NextResponse.json({ error: 'latitude and longitude are required' }, { status: 400 });
  }

  try {
    const res = await supabaseRpc('search_equipment_by_location', {
      p_lat: latitude,
      p_lon: longitude,
      p_radius_miles: radius_miles,
      p_equipment_class: equipment_class || null,
      p_target_date: target_date || null,
      p_limit: 25,
    });

    if (!res.ok) {
      // Fallback: try direct table query if RPC doesn't exist yet
      const fallbackRes = await supabaseFetch(
        `/rest/v1/equipment_inventory?status=eq.available&select=*&order=daily_rate.asc&limit=25`
      );
      if (!fallbackRes.ok) {
        return NextResponse.json({
          results: [],
          meta: { total: 0, latitude, longitude, radius_miles, execution_ms: Date.now() - start },
        });
      }
      const rows = await fallbackRes.json();
      return formatResponse(rows, latitude, longitude, radius_miles, start);
    }

    const rows = await res.json();
    return formatResponse(rows, latitude, longitude, radius_miles, start);
  } catch (err: any) {
    logger.warn('Equipment search failed', { error: err.message });
    return NextResponse.json({
      results: [],
      meta: { total: 0, latitude, longitude, radius_miles, execution_ms: Date.now() - start },
    });
  }
}

function formatResponse(
  rows: any[],
  latitude: number,
  longitude: number,
  radius_miles: number,
  start: number,
): NextResponse<EquipmentRentalSearchResponse> {
  const results: EquipmentRentalResult[] = (rows || []).map((r: any) => ({
    id: r.id,
    provider_name: r.partner_name || r.provider_name || 'Unknown',
    equipment_class: r.equipment_class || 'other',
    distance_miles: Math.round((r.distance_miles ?? 0) * 10) / 10,
    daily_rate: Number(r.daily_rate) || 0,
    weekly_rate: r.weekly_rate ? Number(r.weekly_rate) : null,
    monthly_rate: r.monthly_rate ? Number(r.monthly_rate) : null,
    delivery_fee: Number(r.delivery_fee) || 0,
    proximity_score: r.proximity_score ?? 0,
    trust_index: r.trust_index ?? 0,
    composite_confidence_rating: Math.round(r.composite_rank ?? 0),
    is_verified_partner: r.is_verified_partner ?? false,
    contact_phone: r.contact_phone || null,
    dispatch_email: r.dispatch_email || null,
    city: r.city || null,
    state: r.state || null,
    operator_included: r.operator_included ?? false,
    requires_cdl: r.requires_cdl ?? false,
    minimum_rental_days: r.minimum_rental_days ?? 1,
  }));

  return NextResponse.json({
    results,
    meta: {
      total: results.length,
      latitude,
      longitude,
      radius_miles,
      execution_ms: Date.now() - start,
    },
  });
}
