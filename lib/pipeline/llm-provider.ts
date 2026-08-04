import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret } from "@/lib/crypto/vault";
import * as claude from "@/lib/providers/claude";
import * as gemini from "@/lib/providers/gemini";
import type { GenerateStructuredFn } from "@/lib/providers/llm-types";

// Resolver central de "que LLM usa este workspace para ideacion/guion".
// Prioridad (aprobada por producto, Sprint 3 Parte E):
//   1. BYOK Anthropic activa en /integrations
//   2. BYOK Gemini activa en /integrations (alternativa gratuita)
//   3. ANTHROPIC_API_KEY de plataforma (comportamiento previo, sin cambios)
//
// Nota: el enum provider_name de Postgres todavia no incluye 'anthropic' ni
// 'gemini' en produccion -- la migracion 022_llm_providers.sql ya los agrega,
// pendiente de correr manualmente. Hasta que corra, la consulta de abajo
// simplemente no encuentra filas con esos providers y esta funcion cae al
// fallback de plataforma, que es el comportamiento actual sin cambios.

export type ResolvedGenerator = {
  provider: "anthropic" | "gemini" | "platform";
  model: string;
  generate: GenerateStructuredFn;
  apiKey: string;
};

type IntegrationSecretRow = {
  provider: string;
  status: string;
  ciphertext: string;
  iv: string;
  auth_tag: string;
  key_version: number;
};

/**
 * Decide que proveedor de LLM usar para un workspace y devuelve ya resuelta
 * la funcion `generate` (misma forma para los tres casos, ver
 * lib/providers/llm-types.ts#GenerateStructuredFn) junto con el `model` y la
 * `apiKey` en claro para pasarle a `generate` -- el caller nunca tiene que
 * saber si esta hablando con Claude o con Gemini.
 */
export async function resolveGenerator(
  supabase: SupabaseClient,
  workspaceId: string,
): Promise<ResolvedGenerator> {
  const { data: rows } = await supabase
    .from("integrations")
    .select("provider, status, ciphertext, iv, auth_tag, key_version")
    .eq("workspace_id", workspaceId)
    .in("provider", ["anthropic", "gemini"]);

  const typedRows = (rows ?? []) as IntegrationSecretRow[];

  // decryptSecret puede lanzar (KEK ausente/mal configurada, key_version sin
  // KEK vigente, fila corrupta) — en cualquier otro caller del vault ese
  // fallo se atrapa y degrada con gracia (ver
  // app/(app)/integrations/actions.ts: refreshVoiceLinkStatus siempre se
  // llama con `.catch(() => null)`, verifyIntegration envuelve el decrypt en
  // try/catch). Acá no puede ser distinto: una fila BYOK indescifrable no
  // debe tumbar con una excepción sin atrapar toda la generación de
  // propuestas/guion — se degrada al siguiente proveedor en la prioridad en
  // vez de crashear la Server Action.
  function tryDecrypt(row: IntegrationSecretRow): string | null {
    try {
      return decryptSecret(row);
    } catch {
      return null;
    }
  }

  const anthropicRow = typedRows.find((r) => r.provider === "anthropic" && r.status === "active");
  if (anthropicRow) {
    const apiKey = tryDecrypt(anthropicRow);
    if (apiKey) {
      return {
        provider: "anthropic",
        model: claude.CLAUDE_SONNET,
        generate: claude.generateStructured,
        apiKey,
      };
    }
  }

  const geminiRow = typedRows.find((r) => r.provider === "gemini" && r.status === "active");
  if (geminiRow) {
    const apiKey = tryDecrypt(geminiRow);
    if (apiKey) {
      return {
        provider: "gemini",
        model: gemini.GEMINI_FLASH,
        generate: gemini.generateStructured,
        apiKey,
      };
    }
  }

  return {
    provider: "platform",
    model: claude.CLAUDE_SONNET,
    generate: claude.generateStructured,
    apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  };
}
