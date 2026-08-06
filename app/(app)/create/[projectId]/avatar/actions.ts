"use server";

import { revalidatePath } from "next/cache";
import { assertProjectOwnership } from "../shared";
import { runGenerateAvatarStart, checkAvatarRenderStatus, type GenerateAvatarOutcome, type RenderStatusOutcome } from "../generate-avatar";
import { resolveByokKey } from "@/lib/pipeline/byok";
import { listLooks, type AvatarLook } from "@/lib/providers/heygen";

export type GetLooksResult =
  | { ok: true; looks: AvatarLook[] }
  | { ok: false; reason: "no_workspace" | "not_configured" | "generation_failed" };

/** Solo devuelve looks compatibles con Avatar III — el picker nunca ofrece uno que la generación va a rechazar. */
export async function getLooksForAvatar(projectId: string, avatarId: string): Promise<GetLooksResult> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };

  const key = await resolveByokKey(owned.supabase, owned.workspaceId, "heygen");
  if (!key.ok) return { ok: false, reason: "not_configured" };

  const { data: avatar } = await owned.supabase.from("avatars").select("provider_id").eq("id", avatarId).maybeSingle();
  if (!avatar) return { ok: false, reason: "generation_failed" };

  try {
    const looks = await listLooks(key.apiKey, avatar.provider_id);
    return { ok: true, looks: looks.filter((l) => l.supportsAvatarIII) };
  } catch {
    return { ok: false, reason: "generation_failed" };
  }
}

export type GenerateAvatarResult =
  | { ok: true; renderJobId: string }
  | { ok: false; reason: Extract<GenerateAvatarOutcome, { ok: false }>["reason"] | "no_workspace" };

export async function generateAvatar(
  projectId: string,
  avatarId: string,
  lookId: string,
): Promise<GenerateAvatarResult> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };

  const outcome = await runGenerateAvatarStart(owned.supabase, owned.workspaceId, projectId, avatarId, lookId);
  revalidatePath(`/create/${projectId}/avatar`);
  return outcome;
}

export async function checkRenderStatus(projectId: string, renderJobId: string): Promise<RenderStatusOutcome> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { status: "failed", code: "no_workspace" };

  const outcome = await checkAvatarRenderStatus(owned.supabase, owned.workspaceId, projectId, renderJobId);
  if (outcome.status !== "processing") revalidatePath(`/create/${projectId}/avatar`);
  return outcome;
}
