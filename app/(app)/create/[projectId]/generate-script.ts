import "server-only";
import { createClient } from "@/lib/supabase/server";
import { buildSourceContext, escapeText } from "@/lib/pipeline/context";
import { composeSystemPrompt, getPromptProfile, getNicheSystemPrompt } from "@/lib/pipeline/prompts";
import { resolveGenerator } from "@/lib/pipeline/llm-provider";
import { scriptBlocksSchema, SCRIPT_BLOCKS_JSON_SCHEMA, type ScriptBlocksOutput } from "@/lib/pipeline/schemas";
import { buildBlocksJson, concatenateSpokenText } from "@/lib/pipeline/script-blocks";
import { estimateSeconds } from "@/lib/pipeline/script-metrics";

function wordCountOf(spokenText: string): number {
  return spokenText.split(/\s+/).filter(Boolean).length;
}

export type GenerateScriptOutcome =
  | { ok: true; scriptId: string }
  | { ok: false; reason: "missing_proposal" | "generation_failed" | "not_configured" | "already_generating" };

/**
 * Núcleo del paso 3 (guion) — compartido entre guion/actions.ts#generateScript
 * (botón manual "Generar guion", cuando la generación automática al elegir
 * propuesta falló o el usuario quiere una versión nueva) y
 * propuestas/actions.ts#selectProposal (dispara esto automáticamente al
 * elegir una propuesta, para que /guion llegue con el guion ya armado —
 * docs/04-UX-FLOWS.md). Nunca pisa versiones anteriores: siguiente versión libre.
 *
 * claim_script_generation (023_script_generation_claim.sql) es un lock
 * atómico a nivel de fila: dos pestañas o un doble submit disparando esto
 * casi al mismo tiempo hacían dos llamadas completas al LLM (costo BYOK real
 * duplicado) porque el guard de proposals-grid.tsx solo vive en un árbol de
 * React — no protege entre pestañas. El claim se pide ANTES de gastar nada
 * en el LLM, así que el perdedor de la carrera sale gratis.
 */
export async function runGenerateScript(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  projectId: string,
): Promise<GenerateScriptOutcome> {
  const { data: claimed } = await supabase.rpc("claim_script_generation", { p_project: projectId });
  if (!claimed) return { ok: false, reason: "already_generating" };

  try {
    return await runGenerateScriptClaimed(supabase, workspaceId, projectId);
  } finally {
    await supabase.rpc("release_script_generation", { p_project: projectId });
  }
}

async function runGenerateScriptClaimed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  projectId: string,
): Promise<GenerateScriptOutcome> {
  const { data: project } = await supabase
    .from("projects")
    .select("niche_slug, idea_prompt")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, reason: "generation_failed" };

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
  const ideaLines = project.idea_prompt?.trim()
    ? [`<idea_usuario>\n${escapeText(project.idea_prompt.trim())}\n</idea_usuario>`, ""]
    : [];
  const userContent = [
    ...ideaLines,
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

  const { generate, model, apiKey } = await resolveGenerator(supabase, workspaceId);
  const result = await generate({
    apiKey,
    model,
    system,
    userContent,
    toolName: "emitir_guion",
    toolDescription: "Emite el guion completo de 4 bloques en el formato exigido por el esquema.",
    schemaJson: SCRIPT_BLOCKS_JSON_SCHEMA,
    schema: scriptBlocksSchema,
  });

  if (!result.ok) {
    return { ok: false, reason: result.reason === "not_configured" ? "not_configured" : "generation_failed" };
  }

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
      model,
    })
    .select("id")
    .single();

  if (insertError || !inserted) return { ok: false, reason: "generation_failed" };

  return { ok: true, scriptId: inserted.id };
}
