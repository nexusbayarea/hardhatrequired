import { NextRequest, NextResponse } from 'next/server';
import { getVerticalConfigByDomain } from '@/lib/market/registry';
import { supabaseFetch } from '@/lib/db';
import { logger } from '@/lib/logger';

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
      const res = await supabaseFetch(
        `/rest/v1/searches?vertical_id=eq.${encodeURIComponent(verticalConfig.id)}&order=created_at.desc`
      );

      if (!res.ok) {
        return NextResponse.json({ success: true, vertical: verticalConfig.id, count: 0, searches: [] });
      }

      const data = await res.json();
      return NextResponse.json({
        success: true,
        vertical: verticalConfig.id,
        count: data.length,
        searches: (data || []).map((row: any) => ({
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

      const res = await supabaseFetch('/rest/v1/searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          organization_id: verticalConfig.id,
          vertical_id: verticalConfig.id,
          name,
          zip_code: zip,
          radius_miles: Number(radius),
          result_count: Number(resultCount || 0)
        })
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: 'Failed to persist search to database.' },
          { status: 500 }
        );
      }

      const data = await res.json();
      const record = data[0];

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

      const res = await supabaseFetch(
        `/rest/v1/searches?id=eq.${encodeURIComponent(id)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        return NextResponse.json(
          { error: 'Failed to delete search from database.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Search deleted.' });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'save', 'list', or 'delete'." },
      { status: 400 }
    );
  } catch (err: any) {
    logger.error('Saved searches route error', { route: 'saved-searches', error: String(err) });
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
