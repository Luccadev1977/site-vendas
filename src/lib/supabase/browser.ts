'use client';
import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isGitHubPages } from '../deployment';
let pagesClient: SupabaseClient | undefined;
export function browserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error('O acesso à conta estará disponível após a configuração do Supabase.');
  if (isGitHubPages) {
    pagesClient ??= createClient(url, key, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    });
    return pagesClient;
  }
  return createBrowserClient(url, key);
}
