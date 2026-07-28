import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Workspace del usuario autenticado — resuelto por `workspace_members`, el
 * mismo criterio que la función SQL `current_workspaces()` que usa RLS
 * (supabase/migrations/013_functions.sql), no por `workspaces.owner_id`.
 * Un `admin`/`editor`/`viewer` invitado a un workspace no es su owner pero
 * sí debe poder leer/escribir sus integraciones.
 */
export async function getCurrentWorkspaceId(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  return membership?.workspace_id ?? null;
}
