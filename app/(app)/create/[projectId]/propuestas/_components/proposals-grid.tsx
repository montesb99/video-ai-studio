"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { selectProposal } from "../actions";
import { ProposalCard } from "./proposal-card";
import type { ProposalRow } from "../data";

/**
 * Estado de "seleccionando" vive acá, un nivel arriba de cada tarjeta —no
 * dentro de ProposalCard— para que elegir una propuesta deshabilite las
 * otras dos mientras se genera el guion (docs/04-UX-FLOWS.md: elegir dispara
 * la generación en el mismo paso). Sin esto, un click en otra tarjeta antes
 * de que termine la primera generación dispara dos runGenerateScript
 * concurrentes sobre el mismo proyecto — misma clase de condición de carrera
 * que ya se corrigió para applyAssist/updateBlockText sobre `scripts`.
 */
export function ProposalsGrid({ projectId, proposals }: { projectId: string; proposals: ProposalRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState<{ proposalId: string; reason: string } | null>(null);
  const hasSelection = proposals.some((p) => p.isSelected);

  function handleSelect(proposalId: string) {
    setError(null);
    setSelectingId(proposalId);
    startTransition(async () => {
      try {
        // En éxito, selectProposal redirige — unstable_rethrow relanza esa
        // señal interna de Next (digest NEXT_REDIRECT) en vez de dejar que
        // el catch de acá abajo la trate como un fallo real y muestre un
        // error rojo momentáneo pese a que la navegación igual ocurre.
        const result = await selectProposal(projectId, proposalId);
        if (result && !result.ok) {
          setError({ proposalId, reason: result.reason });
          setSelectingId(null);
        }
      } catch (err) {
        unstable_rethrow(err);
        setError({ proposalId, reason: "generation_failed" });
        setSelectingId(null);
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id}
          proposal={proposal}
          hasSelection={hasSelection}
          disabled={isPending}
          isSelecting={selectingId === proposal.id}
          onSelect={() => handleSelect(proposal.id)}
          error={error?.proposalId === proposal.id ? error.reason : null}
        />
      ))}
    </div>
  );
}
