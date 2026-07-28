import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Único cliente con SUPABASE_SERVICE_ROLE_KEY del repo — bypassa RLS. Uso
 * exclusivo: lib/pipeline/prompts.ts leyendo prompt_profiles (metodología
 * propietaria, sin políticas RLS por diseño — ver 016_prompt_profiles.sql).
 * Nunca usar este cliente para atender directamente una request de usuario.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
