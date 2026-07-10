import { NextRequest, NextResponse } from 'next/server';
import { supabaseRpc, supabaseFetch } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { EquipmentRentalSearchRequest, EquipmentRentalResult, EquipmentRentalSearchResponse } from '@iie/sdk';

/* ── fallback mock data matching the SlurryFlow workspace prototype ── */
const MOCK_GEAR = [
  { id: 'eq1', name: 'CAT 320 Hydraulic Excavation Rig', class: 'excavator_heavy', baseDistance: 4.8, partner: 'United Rentals - Fremont Branch', rating: 4.8, historical_contracts: 120, insurance_verified: true, availability: 1.0, rate: 850, deliveryFee: 250, phone: '800-555-0101', email: 'dispatch@unitedrentals.com', city: 'Fremont', state: 'CA', cdl: false, operator: false, minDays: 1 },
  { id: 'eq2', name: 'Sany SY135C Compact Shutter Excavator', class: 'excavator_heavy', baseDistance: 8.2, partner: 'Sunbelt Rentals - Newark Yard', rating: 4.2, historical_contracts: 85, insurance_verified: true, availability: 0.9, rate: 620, deliveryFee: 180, phone: '800-555-0102', email: null, city: 'Newark', state: 'CA', cdl: false, operator: false, minDays: 1 },
  { id: 'eq3', name: 'Peterbilt 5,000 Gal Tanker (Dual-Line)', class: 'vacuum_truck_5k', baseDistance: 11.5, partner: 'Bay Area Vac Systems', rating: 4.9, historical_contracts: 150, insurance_verified: true, availability: 0.95, rate: 1450, deliveryFee: 350, phone: '888-555-0103', email: 'dispatch@bayareavacs.com', city: 'Hayward', state: 'CA', cdl: true, operator: true, minDays: 3 },
  { id: 'eq4', name: 'Sewer Equipment CO. 3,000 Gal Jet-Vac', class: 'vacuum_truck_3k', baseDistance: 6.1, partner: 'Fremont Fleet Solutions', rating: 4.5, historical_contracts: 60, insurance_verified: false, availability: 0.8, rate: 1200, deliveryFee: 290, phone: '510-555-0104', email: null, city: 'Fremont', state: 'CA', cdl: false, operator: false, minDays: 1 },
  { id: 'eq5', name: '21,000 Gal Closed Top Frac Storage Tank', class: 'frac_tank_21k', baseDistance: 19.3, partner: 'Ironwood Supply & Tank', rating: 4.7, historical_contracts: 110, insurance_verified: true, availability: 1.0, rate: 350, deliveryFee: 450, phone: '800-555-0105', email: 'orders@ironwoodtank.com', city: 'Oakland', state: 'CA', cdl: false, operator: false, minDays: 7 },
  { id: 'eq6', name: '18ft Tandem Axle End Dump Trailer Unit', class: 'end_dump_trailer', baseDistance: 3.5, partner: 'Tri-City Rental Depot', rating: 4.0, historical_contracts: 40, insurance_verified: true, availability: 0.75, rate: 220, deliveryFee: 110, phone: null, email: null, city: 'Union City', state: 'CA', cdl: true, operator: true, minDays: 1 },
  { id: 'eq7', name: 'Dewatering Pump 6" Hydraulic Submersible', class: 'dewatering_pump', baseDistance: 9.0, partner: 'PumpWorks Rentals', rating: 4.3, historical_contracts: 90, insurance_verified: true, availability: 0.9, rate: 480, deliveryFee: 200, phone: '800-555-0107', email: null, city: 'San Jose', state: 'CA', cdl: false, operator: false, minDays: 1 },
  { id: 'eq8', name: 'Vacuum Truck 3K 2025 Model', class: 'vacuum_truck_3k', baseDistance: 14.2, partner: 'Allied Waste Services', rating: 4.1, historical_contracts: 45, insurance_verified: false, availability: 0.85, rate: 1100, deliveryFee: 300, phone: null, email: 'rentals@alliedwaste.com', city: 'San Leandro', state: 'CA', cdl: false, operator: true, minDays: 2 },
];

/* ── scoring formulas matching the SlurryFlow workspace prototype ── */
function computeScoring(
  baseDistance: number,
  radiusMiles: number,
  rating: number,
  historicalContracts: number,
  insuranceVerified: boolean,
  availability: number,
) {
  const s_prox = Math.max(0, 100 * (1 - baseDistance / radiusMiles));
  const r_partner = (rating / 5.0) * 100;
  const c_historical = Math.min(100, (historicalContracts / 150) * 100);
  const i_insurance = insuranceVerified ? 100 : 0;
  const trustIndex = 0.50 * r_partner + 0.30 * c_historical + 0.20 * i_insurance;
  const compositeRank = 0.40 * s_prox + 0.40 * trustIndex + 0.20 * (availability * 100);
  return { s_prox: Math.round(s_prox), trustIndex: Math.round(trustIndex), compositeRank: Math.round(compositeRank) };
}

/* ── fallback using inline mock data ── */
function fallbackSearch(
  latitude: number,
  longitude: number,
  radius_miles: number,
  equipment_class?: string,
): EquipmentRentalResult[] {
  /* spatial multiplier: approximate distance from Fremont centroid 37.7749,-122.4194 */
  const latDiff = Math.abs(latitude - 37.7749);
  const lngDiff = Math.abs(longitude + 122.4194);
  const spatialMultiplier = 1.0 + (latDiff + lngDiff) * 6;

  return MOCK_GEAR
    .filter(g => !equipment_class || g.class === equipment_class)
    .filter(g => g.baseDistance * spatialMultiplier <= radius_miles)
    .map(g => {
      const distance = Math.round(g.baseDistance * spatialMultiplier * 10) / 10;
      const { s_prox, trustIndex, compositeRank } = computeScoring(
        distance, radius_miles, g.rating, g.historical_contracts, g.insurance_verified, g.availability,
      );
      return {
        id: g.id,
        provider_name: g.partner,
        equipment_class: g.class,
        distance_miles: distance,
        daily_rate: g.rate,
        weekly_rate: Math.round(g.rate * 5 * 0.9),
        monthly_rate: Math.round(g.rate * 22 * 0.8),
        delivery_fee: g.deliveryFee,
        proximity_score: s_prox,
        trust_index: trustIndex,
        composite_confidence_rating: compositeRank,
        is_verified_partner: g.insurance_verified,
        contact_phone: g.phone,
        dispatch_email: g.email,
        city: g.city,
        state: g.state,
        operator_included: g.operator,
        requires_cdl: g.cdl,
        minimum_rental_days: g.minDays,
      };
    })
    .sort((a, b) => b.composite_confidence_rating - a.composite_confidence_rating);
}

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

    if (res.ok) {
      const rows = await res.json();
      if (rows && rows.length > 0) {
        return formatResponse(rows, latitude, longitude, radius_miles, start);
      }
    }
  } catch (err: any) {
    logger.warn('Supabase equipment search unavailable, using fallback', { error: err.message });
  }

  const fallback = fallbackSearch(latitude, longitude, radius_miles, equipment_class);
  return NextResponse.json({
    results: fallback,
    meta: { total: fallback.length, latitude, longitude, radius_miles, execution_ms: Date.now() - start },
  });
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
