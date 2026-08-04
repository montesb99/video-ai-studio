"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { assertProjectOwnership } from "../shared";
import { runGenerateProposals, type GenerateProposalsOutcome } from "../generate-proposals";
import { runGenerateScript } from "../generate-script";

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

  // docs/04-UX-FLOWS.md: elegir una propuesta genera el guion en el mismo
  // paso, para que /guion llegue con el editor ya armado en vez de una
  // pantalla vacía con un botón "Generar guion" aparte. Un fallo acá (sin
  // clave configurada, límite de tasa, etc.) no debe bloquear la selección
  // ya confirmada — el usuario igual llega a /guion, con el botón manual
  // "Generar guion" como respaldo para reintentar.
  await runGenerateScript(owned.supabase, owned.workspaceId, projectId).catch(() => null);

  revalidatePath(`/create/${projectId}`);
  redirect(`/create/${projectId}/guion`);
}
