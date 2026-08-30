'use client';

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | undefined;

/**
 * Creates a singleton Supabase client for Client Components ('use client').
 * Preserves active Realtime WebSocket subscriptions across React re-renders.
 */
export function createSupabaseBrowserClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return client;
}
