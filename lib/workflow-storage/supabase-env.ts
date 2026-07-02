import "server-only";

/**
 * Server-only Supabase credentials for Command Hub workflow storage.
 *
 * Accepts legacy and Supabase Connect dialog naming:
 * - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL for URL only)
 * - SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY
 *
 * Do not use SUPABASE_PUBLISHABLE_KEY for workflow storage — it cannot bypass RLS.
 */

export function getSupabaseProjectUrl(): string | null {
  const url =
    process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url || null;
}

export function getSupabaseServiceRoleKey(): string | null {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim();
  return key || null;
}

export function isSupabaseWorkflowCredentialsConfigured(): boolean {
  return Boolean(getSupabaseProjectUrl() && getSupabaseServiceRoleKey());
}
