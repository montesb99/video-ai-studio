import { getTranslations } from "next-intl/server";
import { getProposalsScreenData } from "./data";
import { ProposalCard } from "./_components/proposal-card";
import { RegenerateButton } from "./_components/regenerate-button";

export const maxDuration = 60;

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {proposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              projectId={projectId}
              proposal={proposal}
              hasSelection={proposals.some((p) => p.isSelected)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
