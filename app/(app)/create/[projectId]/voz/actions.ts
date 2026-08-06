"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertProjectOwnership } from "../shared";
import { runGenerateVoice, type GenerateVoiceOutcome } from "../generate-voice";
import type { StoredVoiceSettings } from "@/lib/pipeline/voice-presets";

export async function setVoiceSelection(
  projectId: string,
  voiceId: string,
  settings: StoredVoiceSettings,
): Promise<{ ok: boolean }> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false };

  const { error } = await owned.supabase
    .from("projects")
    .update({ voice_id: voiceId, voice_settings_json: settings })
    .eq("id", projectId);

  revalidatePath(`/create/${projectId}/voz`);
  return { ok: !error };
}

// Reason más ancho que GenerateVoiceOutcome — el núcleo nunca devuelve
// "no_workspace" (ese chequeo ocurre acá, antes de invocarlo), pero la
// Server Action sí necesita distinguirlo de "not_configured" (falta de
// clave BYOK): son causas y mensajes distintos, no el mismo "no funcionó".
export type GenerateVoiceResult =
  | { ok: true; assetId: string }
  | { ok: false; reason: Extract<GenerateVoiceOutcome, { ok: false }>["reason"] | "no_workspace" };

// voiceId/settings llegan explícitos (no se confía en que setVoiceSelection ya
// haya terminado de guardar) y se persisten acá mismo antes de generar —
// mismo patrón que generateProposals(projectId, ideaPrompt) del Sprint 3,
// para no dejar una ventana donde "elegir voz" y "Generar" puedan pisarse.
export async function generateVoice(
  projectId: string,
  voiceId: string,
  settings: StoredVoiceSettings,
): Promise<GenerateVoiceResult> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };

  if (!voiceId) return { ok: false, reason: "missing_voice" };

  const { error: saveError } = await owned.supabase
    .from("projects")
    .update({ voice_id: voiceId, voice_settings_json: settings })
    .eq("id", projectId);
  if (saveError) return { ok: false, reason: "generation_failed" };

  const outcome = await runGenerateVoice(owned.supabase, owned.workspaceId, projectId);
  revalidatePath(`/create/${projectId}/voz`);
  return outcome;
}

export type ApproveVoiceResult = { ok: false; reason: "no_workspace" | "incomplete" | "save_failed" };

export async function approveVoice(projectId: string): Promise<ApproveVoiceResult> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };

  const { error } = await owned.supabase.rpc("approve_voice", {
    p_project: projectId,
    p_workspace: owned.workspaceId,
  });

  if (error) {
    if (error.message?.includes("no_scenes") || error.message?.includes("incomplete_voice_generation")) {
      return { ok: false, reason: "incomplete" };
    }
    return { ok: false, reason: "save_failed" };
  }

  revalidatePath(`/create/${projectId}`);
  redirect(`/create/${projectId}/avatar`);
}
