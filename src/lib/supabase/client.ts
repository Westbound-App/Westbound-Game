import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export { isSupabaseConfigured };

/**
 * Browser Supabase client (anon key).
 * Safe for client components; subject to RLS.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
