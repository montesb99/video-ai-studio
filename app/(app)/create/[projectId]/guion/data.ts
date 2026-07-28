import "server-only";
import { getProjectOrNotFound, type ProjectRow } from "../shared";
import type { ScriptBlocksOutput } from "@/lib/pipeline/schemas";

export type ScriptRow = {
  id: string;
  version: number;
  blocksJson: ScriptBlocksOutput;
  estimatedSeconds: number | null;
  isConfirmed: boolean;
};

export type SelectedProposal = {
  id: string;
  hookTitle: string;
  ctaKeyword: string | null;
  ctaGoal: string;
} | null;

export async function getScriptScreenData(projectId: string): Promise<{
  project: ProjectRow;
  script: ScriptRow | null;
  scriptVersions: Array<{ id: string; version: number; isConfirmed: boolean }>;
  selectedProposal: SelectedProposal;
  ctaSuggestions: string[];
}> {
  const { project, supabase } = await getProjectOrNotFound(projectId);

  const [{ data: scripts }, { data: proposalRow }] = await Promise.all([
    supabase
      .from("scripts")
      .select("id, version, blocks_json, estimated_seconds, is_confirmed")
      .eq("project_id", projectId)
      .order("version", { ascending: false }),
    supabase
      .from("idea_proposals")
      .select("id, hook_title, cta_keyword, cta_goal")
      .eq("project_id", projectId)
      .eq("is_selected", true)
      .maybeSingle(),
  ]);

  const latest = scripts?.[0] ?? null;

  const { data: ctaRow } = await supabase
    .from("cta_library")
    .select("keyword_suggestions_json")
    .is("niche_slug", null)
    .eq("goal", proposalRow?.cta_goal ?? "leads")
    .maybeSingle();

  return {
    project,
    script: latest
      ? {
          id: latest.id,
          version: latest.version,
          blocksJson: latest.blocks_json as ScriptBlocksOutput,
          estimatedSeconds: latest.estimated_seconds,
          isConfirmed: latest.is_confirmed,
        }
      : null,
    scriptVersions: (scripts ?? []).map((s) => ({ id: s.id, version: s.version, isConfirmed: s.is_confirmed })),
    selectedProposal: proposalRow
      ? {
          id: proposalRow.id,
          hookTitle: proposalRow.hook_title,
          ctaKeyword: proposalRow.cta_keyword,
          ctaGoal: proposalRow.cta_goal,
        }
      : null,
    ctaSuggestions: (ctaRow?.keyword_suggestions_json as string[] | undefined) ?? ["INNOVACION"],
  };
}
