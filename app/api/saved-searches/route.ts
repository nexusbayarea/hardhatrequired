import { NextRequest, NextResponse } from 'next/server';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { supabaseFetch } from '@/lib/db';

declare global {
  var __savedSearches: Array<{
    id: string;
    organization_id: string;
    vertical_id: string;
    name: string;
    zip_code: string;
    radius_miles: number;
    result_count: number;
    created_at: string;
  }>;
}
globalThis.__savedSearches ??= [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, zip, radius, resultCount } = body;

    const clientHeader = req.headers.get('x-iie-client-context');
    if (!clientHeader) {
      return NextResponse.json(
        { error: 'X-IIE-Client-Context header is required.' },
        { status: 401 }
      );
    }

    const verticalConfig = await getVerticalConfigByDomain(clientHeader);
    if (!verticalConfig) {
      return NextResponse.json(
        { error: `Invalid or unregistered client configuration: '${clientHeader}'` },
        { status: 403 }
      );
    }

    if (action === 'list') {
      const tenantSearches = globalThis.__savedSearches
        .filter((s) => s.vertical_id === verticalConfig.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json({
        success: true,
        vertical: verticalConfig.id,
        count: tenantSearches.length,
        searches: tenantSearches.map((row) => ({
          id: row.id,
          organizationId: row.organization_id,
          verticalId: row.vertical_id,
          name: row.name,
          zipCode: row.zip_code,
          radiusMiles: row.radius_miles,
          resultCount: row.result_count,
          createdAt: row.created_at
        }))
      });
    }

    if (action === 'save') {
      if (!name || !zip || !radius) {
        return NextResponse.json(
          { error: 'Missing required parameters (name, zip, or radius).' },
          { status: 400 }
        );
      }

      const record = {
        id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        organization_id: verticalConfig.id,
        vertical_id: verticalConfig.id,
        name,
        zip_code: zip,
        radius_miles: Number(radius),
        result_count: Number(resultCount || 0),
        created_at: new Date().toISOString()
      };

      let persisted = false;
      try {
        const res = await supabaseFetch('/rest/v1/searches', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            organization_id: record.organization_id,
            vertical_id: record.vertical_id,
            name: record.name,
            zip_code: record.zip_code,
            radius_miles: record.radius_miles,
            result_count: record.result_count,
            created_at: record.created_at
          })
        });
        persisted = res.ok;
      } catch {
        persisted = false;
      }

      if (!persisted) {
        globalThis.__savedSearches.push(record);
      }

      return NextResponse.json({
        success: true,
        message: 'Search query cataloged successfully under tenant context.',
        record: {
          id: record.id,
          organizationId: record.organization_id,
          verticalId: record.vertical_id,
          name: record.name,
          zipCode: record.zip_code,
          radiusMiles: record.radius_miles,
          resultCount: record.result_count,
          createdAt: record.created_at
        }
      });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) {
        return NextResponse.json(
          { error: 'Missing required parameter: id.' },
          { status: 400 }
        );
      }

      globalThis.__savedSearches = globalThis.__savedSearches.filter(
        (s) => s.id !== id
      );

      try {
        await supabaseFetch(
          `/rest/v1/searches?id=eq.${encodeURIComponent(id)}`,
          { method: 'DELETE' }
        );
      } catch {
        // In-memory fallback already handled above
      }

      return NextResponse.json({ success: true, message: 'Search deleted.' });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'save', 'list', or 'delete'." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Save Search Internal Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
