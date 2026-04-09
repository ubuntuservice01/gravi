import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL ERROR: Supabase credentials missing! Check Vercel Environment Variables.');
}

// Ensure the client doesn't crash but logs clearly if config is broken
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-if-missing.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
