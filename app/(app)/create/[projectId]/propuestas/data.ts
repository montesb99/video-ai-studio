import "server-only";
import { getProjectOrNotFound, type ProjectRow } from "../shared";

export type ProposalRow = {
  id: string;
  index: number;
  approach: string;
  hookTitle: string;
  description: string;
  whyItWorks: string;
  viralityScore: number;
  viralityReason: string | null;
  ctaGoal: string;
  ctaText: string;
  ctaKeyword: string | null;
  estimatedSeconds: number;
  isSelected: boolean;
};

export async function getProposalsScreenData(
  projectId: string,
): Promise<{ project: ProjectRow; proposals: ProposalRow[] }> {
  const { project, supabase } = await getProjectOrNotFound(projectId);

  const { data } = await supabase
    .from("idea_proposals")
    .select(
      "id, index, approach, hook_title, description, why_it_works, virality_score, virality_reason, cta_goal, cta_text, cta_keyword, estimated_seconds, is_selected",
    )
    .eq("project_id", projectId)
    .order("index");

  return {
    project,
    proposals: (data ?? []).map((p) => ({
      id: p.id,
      index: p.index,
      approach: p.approach,
      hookTitle: p.hook_title,
      description: p.description,
      whyItWorks: p.why_it_works,
      viralityScore: p.virality_score,
      viralityReason: p.virality_reason,
      ctaGoal: p.cta_goal,
      ctaText: p.cta_text,
      ctaKeyword: p.cta_keyword,
      estimatedSeconds: p.estimated_seconds,
      isSelected: p.is_selected,
    })),
  };
}
