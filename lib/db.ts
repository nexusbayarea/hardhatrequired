function getUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function supabaseFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = getUrl();
  const key = getKey();
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  return fetch(`${url}${path}`, {
    ...options,
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      ...options?.headers,
    },
  });
}

export async function supabaseRpc(name: string, params?: Record<string, unknown>): Promise<Response> {
  return supabaseFetch(`/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: params ? JSON.stringify(params) : undefined,
  });
}
