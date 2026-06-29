import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ciysvuxxxsqkpbgugcyi.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;



export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'placeholder_anon_key_for_builds'
);
