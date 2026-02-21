import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _browserClient: SupabaseClient | null = null;

/**
 * Browser-only client for pages/components
 * - On server/build/prerender returns null to avoid crash
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) return null;

  if (!_browserClient) _browserClient = createClient(url, key);
  return _browserClient;
}

/**
 * Backward-compatible export.
 * Do NOT import this in server components.
 * In browser it is safe.
 */
export const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
);