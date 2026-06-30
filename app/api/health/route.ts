import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks: Record<string, any> = {};

  // Database check
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data, error } = await supabase.from('organizations').select('id').limit(1);
    checks.database = !error;
    checks.databaseError = error?.message || null;
  } catch (e: any) {
    checks.database = false;
    checks.databaseError = e.message;
  }

  // Auth check
  try {
    const { data } = await supabase.auth.getSession();
    checks.auth = true;
  } catch {
    checks.auth = false;
  }

  // Provider health (circuit breakers)
  try {
    const { getCircuitHealth } = await import('@/lib/market/reliability');
    checks.providers = getCircuitHealth();
  } catch {
    checks.providers = {};
  }

  // API keys check
  checks.apiKeys = {
    googlePlaces: !!process.env.GOOGLE_PLACES_API_KEY,
    tomtom: !!process.env.TOM_TOM_API,
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    brave: !!process.env.BRAVE_API_KEY,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    qstash: !!process.env.QSTASH_TOKEN,
    upstashRedis: !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN,
  };

  const allOk = checks.database && checks.auth;

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    ...checks,
    timestamp: new Date().toISOString(),
  });
}
