import "server-only";
import { createClient } from "@/lib/supabase/server";
import { buildSourceContext } from "@/lib/pipeline/context";
import { composeSystemPrompt, getPromptProfile, getNicheSystemPrompt } from "@/lib/pipeline/prompts";
import { generateStructured, CLAUDE_SONNET } from "@/lib/providers/claude";
import { proposalsSchema, PROPOSALS_JSON_SCHEMA } from "@/lib/pipeline/schemas";

export type GenerateProposalsOutcome =
  | { ok: true }
  | { ok: false; reason: "missing_source" | "generation_failed" };

/**
 * Núcleo del paso 2 (ideating) — compartido entre idea/actions.ts
 * (generateProposals, primera vez, redirige a /propuestas) y
 * propuestas/actions.ts (regenerateProposals, "Generar otras 3", ya está en
 * esa pantalla). Nunca pisa propuestas anteriores: siguiente índice libre.
 */
export async function runGenerateProposals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
): Promise<GenerateProposalsOutcome> {
  const { data: project } = await supabase
    .from("projects")
    .select("video_type, niche_slug")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, reason: "generation_failed" };

  const { data: readySources } = await supabase
    .from("input_sources")
    .select("kind, platform, url, extracted_text")
    .eq("project_id", projectId)
    .eq("status", "ready");

  if (!readySources || readySources.length === 0) {
    return { ok: false, reason: "missing_source" };
  }

  const context = buildSourceContext(
    readySources.map((s) => ({
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
      getPromptProfile("task", "ideate"),
      getNicheSystemPrompt(project.niche_slug),
    ]);
  } catch {
    return { ok: false, reason: "generation_failed" };
  }

  const system = composeSystemPrompt({ methodologyBase, nicheProfile, taskInstructions });
  const result = await generateStructured({
    model: CLAUDE_SONNET,
    system,
    userContent: `Tipo de video: ${project.video_type}.\n\n${context}`,
    toolName: "emitir_propuestas",
    toolDescription: "Emite exactamente 3 propuestas de video en el formato exigido por el esquema.",
    schemaJson: PROPOSALS_JSON_SCHEMA,
    schema: proposalsSchema,
  });

  if (!result.ok) return { ok: false, reason: "generation_failed" };

  const { data: existing } = await supabase
    .from("idea_proposals")
    .select("index")
    .eq("project_id", projectId)
    .order("index", { ascending: false })
    .limit(1);
  const startIndex = (existing?.[0]?.index ?? 0) + 1;

  const rows = result.data.propuestas.map((p, i) => ({
    project_id: projectId,
    index: startIndex + i,
    approach: p.enfoque,
    hook_title: p.gancho,
    description: p.descripcion,
    why_it_works: p.porQueFunciona,
    virality_score: p.viralidad.puntaje,
    virality_reason: p.viralidad.razon,
    cta_goal: p.cta.objetivo,
    cta_text: p.cta.texto,
    cta_keyword: p.cta.palabraClave,
    estimated_seconds: p.duracionEstimada,
    model: CLAUDE_SONNET,
  }));

  const { error: insertError } = await supabase.from("idea_proposals").insert(rows);
  if (insertError) return { ok: false, reason: "generation_failed" };

  const updates: Record<string, unknown> = { status: "ideating", current_step: 2 };
  if (result.data.nichoDetectado && !project.niche_slug) updates.niche_slug = result.data.nichoDetectado;
  await supabase.from("projects").update(updates).eq("id", projectId);

  return { ok: true };
}
