import "server-only";
import { getProjectOrNotFound, type ProjectRow } from "../shared";
import { listNiches, type Niche } from "@/lib/pipeline/niches";

export type SourceRow = {
  id: string;
  kind: string;
  url: string | null;
  status: string;
  errorCode: string | null;
  tokensEst: number | null;
};

export async function getIdeaScreenData(
  projectId: string,
): Promise<{ project: ProjectRow; niches: Niche[]; sources: SourceRow[] }> {
  const { project, supabase } = await getProjectOrNotFound(projectId);

  const [{ data: sources }, niches] = await Promise.all([
    supabase
      .from("input_sources")
      .select("id, kind, url, status, error_code, tokens_est")
      .eq("project_id", projectId)
      .order("created_at"),
    listNiches(),
  ]);

  return {
    project,
    niches,
    sources: (sources ?? []).map((s) => ({
      id: s.id,
      kind: s.kind,
      url: s.url,
      status: s.status,
      errorCode: s.error_code,
      tokensEst: s.tokens_est,
    })),
  };
}
