import { NextRequest, NextResponse } from 'next/server';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { GeospatialProspectResult } from '@/types/rpc_gis';
import { supabaseRpc } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lon, radius, search } = body;

    if (lat === undefined || lon === undefined || radius === undefined) {
      return NextResponse.json(
        { error: 'Incomplete parameters. Latitude (lat), Longitude (lon), and Radius (radius) are required.' },
        { status: 400 }
      );
    }

    const clientHeader = req.headers.get('x-iie-client-context');
    if (!clientHeader) {
      return NextResponse.json(
        { error: 'X-IIE-Client-Context context signature is required.' },
        { status: 401 }
      );
    }

    const verticalConfig = await getVerticalConfigByDomain(clientHeader);
    if (!verticalConfig) {
      return NextResponse.json(
        { error: 'Unregistered or inactive client configuration context.' },
        { status: 403 }
      );
    }

    let data: any;

    try {
      const rpcResponse = await supabaseRpc('search_companies_by_radius_by_org', {
        p_org_id: verticalConfig.id,
        p_center_lat: Number(lat),
        p_center_lon: Number(lon),
        p_radius_miles: Number(radius),
        p_vertical_id: verticalConfig.id,
        p_search_query: search || null
      });

      if (!rpcResponse.ok) {
        const errorText = await rpcResponse.text();
        return NextResponse.json({
          success: false,
          error: 'Database geospatial RPC call failed.',
          details: errorText
        }, { status: 502 });
      }

      data = await rpcResponse.json();
    } catch {
      return NextResponse.json({
        success: true,
        note: 'Supabase credentials not configured. GIS and FTS queries unavailable.',
        tenantId: verticalConfig.id,
        industry: verticalConfig.industryName,
        prospects: []
      });
    }

    const formattedResults: GeospatialProspectResult[] = (data || []).map((row: any) => ({
      id: row.id,
      companyName: row.company_name,
      website: row.website,
      phone: row.phone,
      email: row.email,
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      latitude: Number(row.latitude || 0),
      longitude: Number(row.longitude || 0),
      distanceMiles: Number(Number(row.distance_miles || 0).toFixed(2)),
      priorityGroup: row.priority_group,
      status: row.status,
      capabilitySummary: row.capability_summary,
      searchRank: Number(row.search_rank || 0)
    }));

    return NextResponse.json({
      success: true,
      tenantId: verticalConfig.id,
      industry: verticalConfig.industryName,
      count: formattedResults.length,
      coordinates: { centerLatitude: lat, centerLongitude: lon },
      radiusMiles: radius,
      prospects: formattedResults
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
