export type AuthProvider = 'supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  orgId?: string;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

export async function getSession(): Promise<AuthState | null> {
  try {
    const res = await fetch('/api/auth/me', { method: 'POST' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
