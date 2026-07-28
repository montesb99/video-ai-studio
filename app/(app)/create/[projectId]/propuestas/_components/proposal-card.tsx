"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { selectProposal } from "../actions";
import { ViralityBadge } from "./virality-badge";
import type { ProposalRow } from "../data";

export function ProposalCard({
  projectId,
  proposal,
  hasSelection,
}: {
  projectId: string;
  proposal: ProposalRow;
  hasSelection: boolean;
}) {
  const t = useTranslations("proposals");
  const [isPending, startTransition] = useTransition();

  function handleSelect() {
    startTransition(async () => {
      try {
        await selectProposal(projectId, proposal.id);
      } catch {
        // silencioso — el usuario puede volver a hacer clic
      }
    });
  }

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-5 transition-opacity ${
        proposal.isSelected
          ? "border-[rgba(124,92,255,.5)] bg-[rgba(124,92,255,.06)] shadow-glow-accent"
          : "border-white/6 bg-surface-panel"
      } ${hasSelection && !proposal.isSelected ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-white/44 uppercase">
          {proposal.isSelected && (
            <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-gradient-accent text-white">
              <CheckIcon className="size-2.5" />
            </span>
          )}
          {proposal.approach}
        </div>
        <ViralityBadge score={proposal.viralityScore} reason={proposal.viralityReason} />
      </div>

      <div className="mt-2 text-base leading-snug font-semibold">{proposal.hookTitle}</div>
      <p className="mt-2 text-sm text-white/68">{proposal.description}</p>
      <p className="mt-2 text-xs text-white/44">{proposal.whyItWorks}</p>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/44">
        <span>{t("estimatedSeconds", { seconds: proposal.estimatedSeconds })}</span>
        {proposal.ctaKeyword && <span>{t("ctaKeyword", { keyword: proposal.ctaKeyword })}</span>}
      </div>

      <Button
        className="mt-4 bg-gradient-accent text-white hover:brightness-110"
        size="sm"
        disabled={isPending || proposal.isSelected}
        onClick={handleSelect}
      >
        {proposal.isSelected ? t("selected") : t("selectButton")}
      </Button>
    </div>
  );
}
