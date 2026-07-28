import { getTranslations } from "next-intl/server";
import { getIdeaScreenData } from "./data";
import { TypeSelector } from "./_components/type-selector";
import { NichePicker } from "./_components/niche-picker";
import { SourceComposer } from "./_components/source-composer";

// Paso 1 (ingesta de una fuente, hasta ~90s) y paso 2 (ideación, 8-15s)
// síncronos, sin Inngest todavía (Sprint 5) — ver generateProposals en
// ../generate-proposals.ts y attachLinkSource en ./actions.ts.
export const maxDuration = 100;

export default async function IdeaPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const t = await getTranslations("idea");
  const { project, niches, sources } = await getIdeaScreenData(projectId);

  return (
    <div className="mx-auto max-w-2xl p-7 pb-16">
      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight">{t("title")}</div>
        <div className="mt-1 text-sm text-white/68">{t("subtitle")}</div>
      </div>

      <TypeSelector projectId={projectId} value={project.videoType} />
      <NichePicker projectId={projectId} niches={niches} value={project.nicheSlug} />
      <SourceComposer projectId={projectId} sources={sources} videoType={project.videoType} />
    </div>
  );
}
