import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/supabase/workspace";
import type { IntegrationProvider } from "./actions";

export type IntegrationSummary = {
  provider: IntegrationProvider;
  status: "unverified" | "active" | "invalid" | "expired";
  lastFour: string | null;
  lastVerifiedAt: string | null;
  scopesJson: Record<string, boolean | number> | null;
  linkedJson: { linkedToHeygen?: boolean; method?: "api" | "manual" } | null;
};

/**
 * Solo columnas seguras de mostrar en la UI — nunca ciphertext/iv/auth_tag
 * (docs/03-INTEGRATIONS.md "Cifrado de claves": "La API expone únicamente:
 * proveedor, estado, last_four, last_verified_at").
 */
export async function getIntegrations(): Promise<IntegrationSummary[]> {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);
  if (!workspaceId) return [];

  const { data } = await supabase
    .from("integrations")
    .select("provider, status, last_four, last_verified_at, scopes_json, linked_json")
    .eq("workspace_id", workspaceId);

  return (data ?? []).map((row) => ({
    provider: row.provider as IntegrationProvider,
    status: row.status,
    lastFour: row.last_four,
    lastVerifiedAt: row.last_verified_at,
    scopesJson: row.scopes_json,
    linkedJson: row.linked_json,
  }));
}

export type CatalogCounts = {
  voicesTotal: number;
  voicesCloned: number;
  avatarsTotal: number;
};

/** Cuenta de catálogo ya sincronizado — solo se muestra en la tarjeta si el proveedor está conectado. */
export async function getCatalogCounts(): Promise<CatalogCounts> {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);
  if (!workspaceId) return { voicesTotal: 0, voicesCloned: 0, avatarsTotal: 0 };

  const [voicesTotal, voicesCloned, avatarsTotal] = await Promise.all([
    supabase
      .from("voices")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    supabase
      .from("voices")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("is_cloned", true),
    supabase
      .from("avatars")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
  ]);

  return {
    voicesTotal: voicesTotal.count ?? 0,
    voicesCloned: voicesCloned.count ?? 0,
    avatarsTotal: avatarsTotal.count ?? 0,
  };
}
