import "server-only";
import { getProjectOrNotFound, type ProjectRow } from "../shared";
import type { RenderFailureCode } from "../generate-avatar";

export type AvatarOption = {
  id: string;
  providerId: string;
  name: string;
  thumbUrl: string | null;
};

export type RenderJobStatus = {
  id: string;
  status: string;
} | null;

export type AvatarScreenData = {
  project: ProjectRow;
  voiceApproved: boolean;
  avatars: AvatarOption[];
  selectedAvatarId: string | null;
  selectedLookId: string | null;
  activeRenderJob: RenderJobStatus;
  resultVideoUrl: string | null;
  // Código estable, traducible vía avatar.generateErrors.<code> — nunca el
  // texto crudo del proveedor (guardado aparte en render_jobs.error_message,
  // solo para soporte, jamás mostrado: violaría "Interfaz 100% en español").
  lastFailureCode: RenderFailureCode | null;
};

const VOICE_APPROVED_STATUSES = ["styling", "visualizing", "avatar", "composing", "ready"];

export async function getAvatarScreenData(projectId: string): Promise<AvatarScreenData> {
  const { project, workspaceId, supabase } = await getProjectOrNotFound(projectId);

  const [{ data: projectRow }, { data: avatars }, { data: renderJob }] = await Promise.all([
    supabase.from("projects").select("avatar_id, avatar_look").eq("id", projectId).single(),
    supabase.from("avatars").select("id, provider_id, name, thumb_url").eq("workspace_id", workspaceId).order("name"),
    supabase
      .from("render_jobs")
      .select("id, status, response_json, error_code")
      .eq("project_id", projectId)
      .eq("step", "avatar")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const isTerminal = renderJob?.status === "completed" || renderJob?.status === "failed";
  let resultVideoUrl: string | null = null;

  if (renderJob?.status === "completed") {
    const assetId = (renderJob.response_json as { assetId?: string } | null)?.assetId;
    if (assetId) {
      const { data: asset } = await supabase.from("assets").select("storage_path").eq("id", assetId).maybeSingle();
      if (asset) {
        const { data: signed } = await supabase.storage.from("project-media").createSignedUrl(asset.storage_path, 3600);
        resultVideoUrl = signed?.signedUrl ?? null;
      }
    }
  }

  return {
    project,
    voiceApproved: VOICE_APPROVED_STATUSES.includes(project.status),
    avatars: (avatars ?? []).map((a) => ({ id: a.id, providerId: a.provider_id, name: a.name, thumbUrl: a.thumb_url })),
    selectedAvatarId: projectRow?.avatar_id ?? null,
    selectedLookId: projectRow?.avatar_look ?? null,
    activeRenderJob: renderJob && !isTerminal ? { id: renderJob.id, status: renderJob.status } : null,
    resultVideoUrl,
    lastFailureCode:
      renderJob?.status === "failed" ? ((renderJob.error_code as RenderFailureCode) ?? "unknown") : null,
  };
}
