import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Bypasses row-level security entirely. Only ever call this from server-only
// code that has already verified a signed action token — never from
// anything reachable by an unauthenticated request without that check.
export function createAdminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
