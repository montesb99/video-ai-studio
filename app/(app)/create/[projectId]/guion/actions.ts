"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertProjectOwnership } from "../shared";
import { buildSourceContext } from "@/lib/pipeline/context";
import { composeSystemPrompt, getPromptProfile, getNicheSystemPrompt } from "@/lib/pipeline/prompts";
import { generateStructured, CLAUDE_SONNET } from "@/lib/providers/claude";
import {
  scriptBlocksSchema,
  SCRIPT_BLOCKS_JSON_SCHEMA,
  editAssistSchema,
  EDIT_ASSIST_JSON_SCHEMA,
  type ScriptBlocksOutput,
} from "@/lib/pipeline/schemas";
import { buildBlocksJson, concatenateSpokenText, getBlockByPath, setBlockByPath } from "@/lib/pipeline/script-blocks";
import { estimateSeconds } from "@/lib/pipeline/script-metrics";
import { keywordToSpoken } from "@/lib/pipeline/normalize-spoken";
import { estimateProjectCredits } from "@/lib/credits/pricing";

function wordCountOf(spokenText: string): number {
  return spokenText.split(/\s+/).filter(Boolean).length;
}

// palabraClave llega de Claude (blocks.palabraClave, esquema solo exige
// min(1), sin restricción de charset) — sin este escape, un valor con
// caracteres de regex (paréntesis, +, *, etc.) rompía `new RegExp(...)` con
// una excepción no controlada al cambiar la keyword del CTA.
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type GenerateScriptResult =
  | { ok: true; scriptId: string }
  | { ok: false; reason: "missing_proposal" | "generation_failed" | "no_workspace" };

export async function generateScript(projectId: string): Promise<GenerateScriptResult> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };
  const { supabase } = owned;

  const { data: project } = await supabase.from("projects").select("niche_slug").eq("id", projectId).single();
  if (!project) return { ok: false, reason: "no_workspace" };

  const { data: proposal } = await supabase
    .from("idea_proposals")
    .select("id, hook_title, description, why_it_works, cta_goal, cta_text, cta_keyword")
    .eq("project_id", projectId)
    .eq("is_selected", true)
    .maybeSingle();
  if (!proposal) return { ok: false, reason: "missing_proposal" };

  const { data: readySources } = await supabase
    .from("input_sources")
    .select("kind, platform, url, extracted_text")
    .eq("project_id", projectId)
    .eq("status", "ready");

  const context = buildSourceContext(
    (readySources ?? []).map((s) => ({
      kind: s.kind,
      platform: s.platform,
      url: s.url,
      extractedText: s.extracted_text,
    })),
  );

  let methodologyBase: string, taskInstructions: string, nicheProfile: string;
  try {
    [methodologyBase, taskInstructions, nicheProfile] = await Promise.all([
      getPromptProfile("methodology", "base"),
      getPromptProfile("task", "script"),
      getNicheSystemPrompt(project.niche_slug),
    ]);
  } catch {
    return { ok: false, reason: "generation_failed" };
  }

  const system = composeSystemPrompt({ methodologyBase, nicheProfile, taskInstructions });
  const userContent = [
    "Propuesta elegida:",
    `Gancho: ${proposal.hook_title}`,
    `Descripción: ${proposal.description}`,
    `Por qué funciona: ${proposal.why_it_works}`,
    `CTA objetivo: ${proposal.cta_goal}`,
    `CTA texto base: ${proposal.cta_text}`,
    `Palabra clave sugerida: ${proposal.cta_keyword ?? "INNOVACION"}`,
    "",
    context,
  ].join("\n");

  const result = await generateStructured({
    model: CLAUDE_SONNET,
    system,
    userContent,
    toolName: "emitir_guion",
    toolDescription: "Emite el guion completo de 4 bloques en el formato exigido por el esquema.",
    schemaJson: SCRIPT_BLOCKS_JSON_SCHEMA,
    schema: scriptBlocksSchema,
  });

  if (!result.ok) return { ok: false, reason: "generation_failed" };

  let blocksJson: ScriptBlocksOutput;
  try {
    blocksJson = buildBlocksJson(result.data);
  } catch {
    return { ok: false, reason: "generation_failed" };
  }

  const spokenText = concatenateSpokenText(blocksJson);

  const { data: existing } = await supabase
    .from("scripts")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1);
  const nextVersion = (existing?.[0]?.version ?? 0) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from("scripts")
    .insert({
      project_id: projectId,
      idea_proposal_id: proposal.id,
      version: nextVersion,
      blocks_json: blocksJson,
      word_count: wordCountOf(spokenText),
      estimated_seconds: estimateSeconds(spokenText),
      model: CLAUDE_SONNET,
    })
    .select("id")
    .single();

  if (insertError || !inserted) return { ok: false, reason: "generation_failed" };

  revalidatePath(`/create/${projectId}/guion`);
  return { ok: true, scriptId: inserted.id };
}

export type ApplyAssistResult =
  | { ok: true; newVersion: number }
  | { ok: false; reason: "not_found" | "generation_failed" | "no_workspace" };

export async function applyAssist(
  projectId: string,
  scriptId: string,
  input: { blockPath: string; action: "shorten" | "direct" | "tension" | "rewrite" },
): Promise<ApplyAssistResult> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };
  const { supabase } = owned;

  const { data: scriptRow } = await supabase
    .from("scripts")
    .select("blocks_json, version, is_confirmed, idea_proposal_id")
    .eq("id", scriptId)
    .eq("project_id", projectId)
    .single();
  if (!scriptRow || scriptRow.is_confirmed) return { ok: false, reason: "not_found" };

  const blocks = scriptRow.blocks_json as ScriptBlocksOutput;
  const block = getBlockByPath(blocks, input.blockPath);
  if (!block) return { ok: false, reason: "not_found" };

  const { data: project } = await supabase.from("projects").select("niche_slug").eq("id", projectId).single();

  let methodologyBase: string, taskInstructions: string, nicheProfile: string;
  try {
    [methodologyBase, taskInstructions, nicheProfile] = await Promise.all([
      getPromptProfile("methodology", "base"),
      getPromptProfile("task", "assist"),
      getNicheSystemPrompt(project?.niche_slug ?? null),
    ]);
  } catch {
    return { ok: false, reason: "generation_failed" };
  }

  const system = composeSystemPrompt({ methodologyBase, nicheProfile, taskInstructions });
  const userContent = [
    `Acción pedida: ${input.action}`,
    `Fragmento a editar: ${JSON.stringify(block)}`,
    `Guion completo (contexto, no editar lo demás): ${JSON.stringify(blocks)}`,
  ].join("\n");

  const result = await generateStructured({
    model: CLAUDE_SONNET,
    system,
    userContent,
    toolName: "emitir_bloque",
    toolDescription: "Emite el bloque {spoken, onScreen} reescrito según la acción pedida.",
    schemaJson: EDIT_ASSIST_JSON_SCHEMA,
    schema: editAssistSchema,
  });

  if (!result.ok) return { ok: false, reason: "generation_failed" };

  // Claude puede tardar varios segundos: se vuelve a leer blocks_json justo
  // antes de mergear para no pisar una edición manual (updateBlockText) que
  // haya llegado mientras tanto sobre otro bloque de este mismo guion.
  const { data: freshRow } = await supabase
    .from("scripts")
    .select("blocks_json, version, is_confirmed, idea_proposal_id")
    .eq("id", scriptId)
    .eq("project_id", projectId)
    .single();
  if (!freshRow || freshRow.is_confirmed) return { ok: false, reason: "not_found" };

  const freshBlocks = freshRow.blocks_json as ScriptBlocksOutput;
  const merged = setBlockByPath(freshBlocks, input.blockPath, result.data);
  let normalized: ScriptBlocksOutput;
  try {
    normalized = buildBlocksJson(merged);
  } catch {
    return { ok: false, reason: "generation_failed" };
  }

  const spokenText = concatenateSpokenText(normalized);
  const newVersion = freshRow.version + 1;

  const { error: insertError } = await supabase.from("scripts").insert({
    project_id: projectId,
    idea_proposal_id: freshRow.idea_proposal_id,
    version: newVersion,
    blocks_json: normalized,
    word_count: wordCountOf(spokenText),
    estimated_seconds: estimateSeconds(spokenText),
    model: CLAUDE_SONNET,
  });
  if (insertError) return { ok: false, reason: "generation_failed" };

  revalidatePath(`/create/${projectId}/guion`);
  return { ok: true, newVersion };
}

export async function updateBlockText(
  projectId: string,
  scriptId: string,
  input: { blockPath: string; spoken?: string; onScreenPatch?: Record<string, unknown> },
): Promise<{ ok: boolean }> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false };
  const { supabase } = owned;

  const { data: scriptRow } = await supabase
    .from("scripts")
    .select("blocks_json, is_confirmed")
    .eq("id", scriptId)
    .eq("project_id", projectId)
    .single();
  if (!scriptRow || scriptRow.is_confirmed) return { ok: false };

  const blocks = scriptRow.blocks_json as ScriptBlocksOutput;
  const current = getBlockByPath(blocks, input.blockPath);
  if (!current) return { ok: false };

  // Edición manual: se actualiza EN SITIO, sin crear versión nueva y sin
  // pasar por normalize-spoken (esa normalización es una red de seguridad
  // para la salida de Claude, no para reescribir lo que el usuario acaba de
  // tipear). Solo las 4 acciones asistidas versionan (docs/07 §6.4).
  const updatedBlock = {
    spoken: input.spoken ?? current.spoken,
    onScreen: input.onScreenPatch ? { ...current.onScreen, ...input.onScreenPatch } : current.onScreen,
  };
  const merged = setBlockByPath(blocks, input.blockPath, updatedBlock);
  const spokenText = concatenateSpokenText(merged);

  const { error } = await supabase
    .from("scripts")
    .update({
      blocks_json: merged,
      word_count: wordCountOf(spokenText),
      estimated_seconds: estimateSeconds(spokenText),
    })
    .eq("id", scriptId);

  revalidatePath(`/create/${projectId}/guion`);
  return { ok: !error };
}

export type SetCtaKeywordResult = { ok: true } | { ok: false; reason: "invalid_keyword" | "not_found" };

export async function setCtaKeyword(
  projectId: string,
  scriptId: string,
  keywordRaw: string,
): Promise<SetCtaKeywordResult> {
  // Nunca se confía en la normalización del cliente — se repite acá. Quita
  // diacríticos por código de punto Unicode (marcas combinantes U+0300 a
  // U+036F tras NFD) en vez de un literal de regex con el carácter suelto,
  // más difícil de leer y de copiar correctamente.
  const normalized = Array.from(keywordRaw.normalize("NFD"))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return !(code >= 0x0300 && code <= 0x036f);
    })
    .join("")
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{2,20}$/.test(normalized)) {
    return { ok: false, reason: "invalid_keyword" };
  }

  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "not_found" };
  const { supabase } = owned;

  const { data: scriptRow } = await supabase
    .from("scripts")
    .select("blocks_json, is_confirmed")
    .eq("id", scriptId)
    .eq("project_id", projectId)
    .single();
  if (!scriptRow || scriptRow.is_confirmed) return { ok: false, reason: "not_found" };

  const blocks = scriptRow.blocks_json as ScriptBlocksOutput;
  const oldSpokenForm = keywordToSpoken(blocks.palabraClave);
  const newSpokenForm = keywordToSpoken(normalized);

  const updatedCta = {
    spoken: blocks.cta.spoken.replace(new RegExp(escapeRegExp(oldSpokenForm), "gi"), newSpokenForm),
    onScreen: { ...blocks.cta.onScreen, palabraClave: normalized },
  };
  const merged = { ...setBlockByPath(blocks, "cta", updatedCta), palabraClave: normalized };

  const { error } = await supabase.from("scripts").update({ blocks_json: merged }).eq("id", scriptId);
  revalidatePath(`/create/${projectId}/guion`);
  return error ? { ok: false, reason: "not_found" } : { ok: true };
}

export type ConfirmScriptResult =
  | { ok: true }
  | { ok: false; reason: "insufficient_credits"; needed: number; available: number }
  | { ok: false; reason: "no_workspace" | "save_failed" };

export async function confirmScript(projectId: string, scriptId: string): Promise<ConfirmScriptResult> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };
  const { supabase, workspaceId } = owned;

  const { data: scriptRow } = await supabase
    .from("scripts")
    .select("id, blocks_json")
    .eq("id", scriptId)
    .eq("project_id", projectId)
    .single();
  if (!scriptRow) return { ok: false, reason: "save_failed" };

  const blocks = scriptRow.blocks_json as ScriptBlocksOutput;
  // Nunca se confía en el número cacheado del cliente ni en el target_seconds
  // fijo del proyecto: el cobro sale de la duración real del guion confirmado.
  const recalculatedSeconds = estimateSeconds(concatenateSpokenText(blocks));
  const needed = estimateProjectCredits(recalculatedSeconds);

  const { data: workspaceRow } = await supabase
    .from("workspaces")
    .select("credits_balance")
    .eq("id", workspaceId)
    .single();
  const available = workspaceRow?.credits_balance ?? 0;

  const { error } = await supabase.rpc("confirm_script_and_hold", {
    p_script: scriptId,
    p_project: projectId,
    p_workspace: workspaceId,
    p_credits: needed,
  });

  if (error) {
    if (error.message?.includes("insufficient_credits")) {
      return { ok: false, reason: "insufficient_credits", needed, available };
    }
    return { ok: false, reason: "save_failed" };
  }

  revalidatePath(`/create/${projectId}`);
  redirect(`/create/${projectId}/voz`);
}
