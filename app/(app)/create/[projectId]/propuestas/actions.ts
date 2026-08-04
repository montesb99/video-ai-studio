"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertProjectOwnership } from "../shared";
import { runGenerateProposals, type GenerateProposalsOutcome } from "../generate-proposals";

export async function regenerateProposals(projectId: string): Promise<GenerateProposalsOutcome> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "generation_failed" };

  const outcome = await runGenerateProposals(owned.supabase, owned.workspaceId, projectId);
  revalidatePath(`/create/${projectId}/propuestas`);
  return outcome;
}

export type SelectProposalResult = { ok: true } | { ok: false; reason: "no_workspace" | "save_failed" };

export async function selectProposal(projectId: string, proposalId: string): Promise<SelectProposalResult> {
  const owned = await assertProjectOwnership(projectId);
  if (!owned.ok) return { ok: false, reason: "no_workspace" };

  const { error } = await owned.supabase.rpc("select_proposal", {
    p_project: projectId,
    p_proposal: proposalId,
  });
  if (error) return { ok: false, reason: "save_failed" };

  revalidatePath(`/create/${projectId}`);
  redirect(`/create/${projectId}/guion`);
}
