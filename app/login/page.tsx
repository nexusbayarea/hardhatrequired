'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-[#111] border border-gray-800 rounded-2xl p-8">
        <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <div className="h-8 w-8 rounded-lg bg-[#dc2626] flex items-center justify-center">
            <span className="text-white font-bold text-sm">HHR</span>
          </div>
          <span className="text-white font-semibold">Hard Hat Required</span>
        </Link>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#dc2626] text-white"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-[#dc2626] text-white"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/40 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-50 text-white font-medium py-2.5 rounded-xl text-sm transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-500 text-center">
          Powered by Supabase Auth
        </p>
        <div className="mt-6 pt-4 border-t border-gray-800 text-center">
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}
