import { createClient } from '@supabase/supabase-js';
import { verticalSlugToName, formatCitySlug, formatStateSlug } from '@/lib/pseo/utils';
import type { PseoRoute, PseoPageData } from '@/lib/pseo/types';
import JsonLdSchema from '@/components/pseo/JsonLdSchema';
import VendorMap from '@/components/pseo/VendorMap';
import TopFiveList from '@/components/pseo/TopFiveList';
import LiveBidVelocity from '@/components/pseo/LiveBidVelocity';
import NotFound from '@/components/pseo/NotFound';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getClient() {
  return createClient(supabaseUrl, supabaseKey);
}

export async function generateStaticParams(): Promise<PseoRoute[]> {
  if (!supabaseUrl) return [];
  try {
    const { data } = await getClient()
      .from('pseo_active_routes')
      .select('state_slug, city_slug, vertical_slug');
    return (data || []).map(r => ({
      state_slug: r.state_slug,
      city_slug: r.city_slug,
      vertical_slug: r.vertical_slug,
    }));
  } catch {
    return [];
  }
}

export const revalidate = 86400;
export const dynamicParams = true;

export default async function PseoDirectoryPage({
  params,
}: {
  params: { state: string; city: string; vertical: string };
}) {
  const { state, city, vertical } = params;

  let pageData: PseoPageData | null = null;
  if (supabaseUrl) {
    try {
      const { data: raw } = await getClient().rpc('hydrate_pseo_page', {
        target_state: state,
        target_city: city,
        target_vertical: vertical,
      });
      if (raw) pageData = raw as unknown as PseoPageData;
    } catch (e) {
      console.error('[PSEO] hydrate_pseo_page RPC failed:', e);
    }
  }

  const cityName = formatCitySlug(city);
  const stateName = formatStateSlug(state);
  const verticalName = pageData?.vertical_name || verticalSlugToName(vertical);
  const vendors = pageData?.vendors || [];
  const bids = pageData?.recent_regional_bids || null;

  if (vendors.length === 0) {
    return <NotFound />;
  }

  return (
    <main>
      <JsonLdSchema data={pageData!} citySlug={city} stateSlug={state} />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
            Top {verticalName}s in {cityName}
          </h1>
          <p className="mt-2" style={{ color: 'var(--color-muted)' }}>
            {stateName} &mdash; {vendors.length} verified {vendors.length === 1 ? 'provider' : 'providers'}
          </p>
        </div>

        <VendorMap vendors={vendors} cityName={cityName} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
              Top Contractors
            </h2>
            <TopFiveList vendors={vendors} />
          </div>
          <div>
            <LiveBidVelocity bids={bids} />
          </div>
        </div>
      </div>
    </main>
  );
}
