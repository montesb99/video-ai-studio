import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/supabase/workspace";

export type ProjectRow = {
  id: string;
  status: string;
  videoType: string;
  nicheSlug: string | null;
  ideaPrompt: string | null;
  targetSeconds: number;
  currentStep: number;
};

/** Ownership guard explícito además de RLS: da un 404 limpio en vez de depender solo de que la fila vuelva vacía. */
export async function getProjectOrNotFound(projectId: string): Promise<{
  project: ProjectRow;
  workspaceId: string;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);
  if (!workspaceId) notFound();

  const { data } = await supabase
    .from("projects")
    .select("id, status, video_type, niche_slug, idea_prompt, target_seconds, current_step")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!data) notFound();

  return {
    workspaceId,
    supabase,
    project: {
      id: data.id,
      status: data.status,
      videoType: data.video_type,
      nicheSlug: data.niche_slug,
      ideaPrompt: data.idea_prompt,
      targetSeconds: data.target_seconds,
      currentStep: data.current_step,
    },
  };
}

/**
 * Para Server Actions (nunca `notFound()` ahí — devuelve un resultado que la
 * UI puede mostrar en vez de lanzar). El `.eq("workspace_id", ...)` es
 * defensa explícita además de RLS, igual que getProjectOrNotFound.
 */
export async function assertProjectOwnership(
  projectId: string,
): Promise<
  | { ok: true; workspaceId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false }
> {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);
  if (!workspaceId) return { ok: false };

  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (!data) return { ok: false };
  return { ok: true, workspaceId, supabase };
}
