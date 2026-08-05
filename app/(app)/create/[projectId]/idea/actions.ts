"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertProjectOwnership } from "../shared";
import { runGenerateProposals } from "../generate-proposals";
import { createClient } from "@/lib/supabase/server";
import { extractFromText, extractFromLink } from "@/lib/ingest/extract";

export type VideoType = "informativo" | "reaccion" | "desde_enlace";

async function bumpToIngesting(supabase: Awaited<ReturnType<typeof createClient>>, projectId: string) {
  await supabase.from("projects").update({ status: "ingesting" }).eq("id", projectId).eq("status", "draft");
}

export async function setVideoType(projectId: string, videoType: VideoType): Promise<{ ok: boolean }> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false };

  const { error } = await owned.supabase.from("projects").update({ video_type: videoType }).eq("id", projectId);

  revalidatePath(`/create/${projectId}/idea`);
  return { ok: !error };
}

export async function setNiche(projectId: string, nicheSlug: string | null): Promise<{ ok: boolean }> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false };

  const { error } = await owned.supabase.from("projects").update({ niche_slug: nicheSlug }).eq("id", projectId);

  revalidatePath(`/create/${projectId}/idea`);
  return { ok: !error };
}

// Autoguardado de la casilla de idea (onBlur) para que sobreviva a un
// refresh antes de generar — generateProposals además la persiste de nuevo
// de forma atómica junto con la generación, así que este autoguardado es
// una red de conveniencia, no la única escritura.
export async function setIdeaPrompt(projectId: string, ideaPrompt: string): Promise<{ ok: boolean }> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false };

  const trimmed = ideaPrompt.trim();
  const { error } = await owned.supabase
    .from("projects")
    .update({ idea_prompt: trimmed || null })
    .eq("id", projectId);

  revalidatePath(`/create/${projectId}/idea`);
  return { ok: !error };
}

export type AttachSourceResult =
  | { ok: true; sourceId: string }
  | { ok: false; reason: "empty" | "no_workspace" | "save_failed" };

export async function attachTextSource(projectId: string, text: string): Promise<AttachSourceResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };

  const extracted = extractFromText(trimmed);
  const { data, error } = await owned.supabase
    .from("input_sources")
    .insert({
      project_id: projectId,
      kind: "text",
      extracted_text: extracted.ok ? extracted.extractedText : null,
      tokens_est: extracted.ok ? extracted.tokensEst : null,
      status: extracted.ok ? "ready" : "failed",
      error_code: extracted.ok ? null : extracted.errorCode,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, reason: "save_failed" };

  await bumpToIngesting(owned.supabase, projectId);
  revalidatePath(`/create/${projectId}/idea`);
  return { ok: true, sourceId: data.id };
}

export async function attachLinkSource(projectId: string, url: string): Promise<AttachSourceResult> {
  const trimmed = url.trim();
  if (!trimmed) return { ok: false, reason: "empty" };

  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };

  const { data: inserted, error: insertError } = await owned.supabase
    .from("input_sources")
    .insert({ project_id: projectId, kind: "link", url: trimmed, status: "pending" })
    .select("id")
    .single();

  if (insertError || !inserted) return { ok: false, reason: "save_failed" };
  await bumpToIngesting(owned.supabase, projectId);

  // Un fallo de extracción no tumba el proyecto (docs/03 §10: "sigue sin esa
  // fuente, sin cargo") — el estado queda en 'failed' con error_code, la UI
  // lo muestra por adjunto.
  let extracted;
  try {
    extracted = await extractFromLink(trimmed);
  } catch {
    extracted = { ok: false as const, errorCode: "unexpected_error" };
  }

  await owned.supabase
    .from("input_sources")
    .update({
      extracted_text: extracted.ok ? extracted.extractedText : null,
      tokens_est: extracted.ok ? extracted.tokensEst : null,
      status: extracted.ok ? "ready" : "failed",
      error_code: extracted.ok ? null : extracted.errorCode,
    })
    .eq("id", inserted.id);

  revalidatePath(`/create/${projectId}/idea`);
  return { ok: true, sourceId: inserted.id };
}

export async function removeSource(projectId: string, sourceId: string): Promise<{ ok: boolean }> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false };

  const { error } = await owned.supabase
    .from("input_sources")
    .delete()
    .eq("id", sourceId)
    .eq("project_id", projectId);

  revalidatePath(`/create/${projectId}/idea`);
  return { ok: !error };
}

export type GenerateProposalsResult = {
  ok: false;
  reason: "missing_idea" | "missing_link" | "no_workspace" | "generation_failed" | "not_configured";
};

// ideaPrompt llega explícito (no se confía en que el autoguardado de
// setIdeaPrompt ya haya corrido) y se persiste acá mismo, en la misma
// invocación que dispara la generación — así no hay ventana entre "el
// usuario tipeó y sacó el foco" y "clickeó Generar" donde una pudiera
// llegar sin la otra.
export async function generateProposals(projectId: string, ideaPrompt: string): Promise<GenerateProposalsResult> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };

  const trimmed = ideaPrompt.trim();
  if (!trimmed) return { ok: false, reason: "missing_idea" };

  const { error: saveError } = await owned.supabase
    .from("projects")
    .update({ idea_prompt: trimmed })
    .eq("id", projectId);
  if (saveError) return { ok: false, reason: "generation_failed" };

  const outcome = await runGenerateProposals(owned.supabase, owned.workspaceId, projectId);
  if (!outcome.ok) return outcome;

  revalidatePath(`/create/${projectId}`);
  redirect(`/create/${projectId}/propuestas`);
}
