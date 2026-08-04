import { getTranslations } from "next-intl/server";
import { getProposalsScreenData } from "./data";
import { ProposalsGrid } from "./_components/proposals-grid";
import { RegenerateButton } from "./_components/regenerate-button";

// selectProposal encadena select_proposal (RPC, <1s) + runGenerateScript
// completo — el mismo trabajo al que guion/page.tsx le dedica sus 60s
// propios. Sin este ajuste, esta ruta cortaba la función a mitad de la
// generación con los 60s por defecto, antes de que el guion terminara.
export const maxDuration = 70;

export default async function ProposalsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const t = await getTranslations("proposals");
  const { proposals } = await getProposalsScreenData(projectId);

  return (
    <div className="mx-auto max-w-4xl p-7 pb-16">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold tracking-tight">{t("title")}</div>
          <div className="mt-1 text-sm text-white/68">{t("subtitle")}</div>
        </div>
        <RegenerateButton projectId={projectId} />
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-2xl border border-white/6 bg-surface-panel p-8 text-center text-sm text-white/44">
          {t("empty")}
        </div>
      ) : (
        <ProposalsGrid projectId={projectId} proposals={proposals} />
      )}
    </div>
  );
}
