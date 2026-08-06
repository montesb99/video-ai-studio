import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret } from "@/lib/crypto/vault";

type IntegrationSecretRow = {
  ciphertext: string;
  iv: string;
  auth_tag: string;
  key_version: number;
};

/**
 * ElevenLabs y HeyGen son BYOK puro (a diferencia de Claude/Gemini, que
 * tienen respaldo de plataforma) — sin clave activa no hay generación
 * posible, así que no hace falta un resolver con prioridad como
 * lib/pipeline/llm-provider.ts, solo esto.
 */
export async function resolveByokKey(
  supabase: SupabaseClient,
  workspaceId: string,
  provider: string,
): Promise<{ ok: true; apiKey: string } | { ok: false }> {
  const { data } = await supabase
    .from("integrations")
    .select("ciphertext, iv, auth_tag, key_version")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .eq("status", "active")
    .maybeSingle();
  if (!data) return { ok: false };

  try {
    return { ok: true, apiKey: decryptSecret(data as IntegrationSecretRow) };
  } catch {
    return { ok: false };
  }
}
