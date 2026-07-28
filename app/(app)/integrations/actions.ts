"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/supabase/workspace";
import { decryptSecret, encryptSecret, lastFourOf } from "@/lib/crypto/vault";
import * as elevenlabs from "@/lib/providers/elevenlabs";
import * as heygen from "@/lib/providers/heygen";
import * as openai from "@/lib/providers/openai";

export type IntegrationProvider = "elevenlabs" | "heygen" | "openai";

type ProviderVerification = {
  status: "active" | "invalid" | "unverified";
  missingPermission?: string;
  amber?: "no_credits" | "rate_limited";
  scopes: Record<string, boolean | number>;
};

async function verifyProviderKey(
  provider: IntegrationProvider,
  apiKey: string,
): Promise<ProviderVerification> {
  switch (provider) {
    case "elevenlabs": {
      const r = await elevenlabs.verifyKey(apiKey);
      return { status: r.status, missingPermission: r.missingPermission, amber: r.amber, scopes: r.scopes };
    }
    case "heygen": {
      const r = await heygen.verifyKey(apiKey);
      return { status: r.status, missingPermission: r.missingPermission, amber: r.amber, scopes: r.scopes };
    }
    case "openai": {
      const r = await openai.verifyKey(apiKey);
      return { status: r.status, missingPermission: r.missingPermission, amber: r.amber, scopes: r.scopes };
    }
  }
}

/** Última fila gana si el proveedor repitiera un `providerId` en el mismo lote — el upsert por lote falla entero si hay duplicados dentro del array. */
function dedupeByProviderId<T extends { providerId: string }>(rows: T[]): T[] {
  return Array.from(new Map(rows.map((row) => [row.providerId, row])).values());
}

async function syncCatalog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  provider: "elevenlabs" | "heygen",
  apiKey: string,
) {
  if (provider === "elevenlabs") {
    const voices = dedupeByProviderId(await elevenlabs.listVoices(apiKey));
    if (voices.length === 0) return;
    await supabase.from("voices").upsert(
      voices.map((v) => ({
        workspace_id: workspaceId,
        provider_id: v.providerId,
        name: v.name,
        is_cloned: v.isCloned,
        category: v.category,
        labels_json: v.labels,
        preview_url: v.previewUrl,
        synced_at: new Date().toISOString(),
      })),
      { onConflict: "workspace_id,provider_id" },
    );
  } else {
    const avatars = dedupeByProviderId(await heygen.listAvatars(apiKey));
    if (avatars.length === 0) return;
    await supabase.from("avatars").upsert(
      avatars.map((a) => ({
        workspace_id: workspaceId,
        provider_id: a.providerId,
        name: a.name,
        thumb_url: a.thumbUrl,
        synced_at: new Date().toISOString(),
      })),
      { onConflict: "workspace_id,provider_id" },
    );
  }
}

/**
 * Modo A/B (docs/03-INTEGRATIONS.md §2b): si ElevenLabs y HeyGen están
 * ambos activos, intenta que HeyGen use la clave de ElevenLabs del
 * workspace. `provisionVoiceProvider` hoy siempre devuelve `linked:false,
 * method:"manual"` (no hay endpoint público confirmado) — el resultado se
 * persiste en `integrations.linked_json` de la fila de ElevenLabs, que es
 * lo que pinta la segunda línea de estado y el panel guiado en la UI.
 */
async function refreshVoiceLinkStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
) {
  const { data: rows } = await supabase
    .from("integrations")
    .select("provider, status, ciphertext, iv, auth_tag, key_version")
    .eq("workspace_id", workspaceId)
    .in("provider", ["elevenlabs", "heygen"]);

  const elevenlabsRow = rows?.find((r) => r.provider === "elevenlabs" && r.status === "active");
  const heygenRow = rows?.find((r) => r.provider === "heygen" && r.status === "active");
  if (!elevenlabsRow || !heygenRow) return;

  const elevenlabsKey = decryptSecret(elevenlabsRow);
  const heygenKey = decryptSecret(heygenRow);
  const result = await heygen.provisionVoiceProvider(heygenKey, elevenlabsKey);

  await supabase
    .from("integrations")
    .update({ linked_json: { linkedToHeygen: result.linked, method: result.method } })
    .eq("workspace_id", workspaceId)
    .eq("provider", "elevenlabs");
}

export type IntegrationActionResult =
  | {
      ok: true;
      status: "active" | "invalid" | "unverified";
      missingPermission?: string;
      amber?: "no_credits" | "rate_limited";
    }
  | {
      ok: false;
      reason: "empty_key" | "no_workspace" | "save_failed" | "verification_failed" | "unexpected_error";
    };

export async function saveIntegrationKey(
  provider: IntegrationProvider,
  apiKey: string,
): Promise<IntegrationActionResult> {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) return { ok: false, reason: "empty_key" };

  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);
  if (!workspaceId) return { ok: false, reason: "no_workspace" };

  let verification: ProviderVerification;
  try {
    verification = await verifyProviderKey(provider, trimmedKey);
  } catch {
    // Red caída / KEK mal configurada / respuesta inesperada del proveedor:
    // no debe tumbar la Server Action sin avisarle nada al usuario.
    return { ok: false, reason: "verification_failed" };
  }
  const encrypted = encryptSecret(trimmedKey);

  const { error } = await supabase.from("integrations").upsert(
    {
      workspace_id: workspaceId,
      provider,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      auth_tag: encrypted.authTag,
      key_version: encrypted.keyVersion,
      last_four: lastFourOf(trimmedKey),
      status: verification.status,
      last_verified_at: new Date().toISOString(),
      scopes_json: verification.scopes,
    },
    { onConflict: "workspace_id,provider" },
  );

  if (error) {
    return { ok: false, reason: "save_failed" };
  }

  if (verification.status === "active" && (provider === "elevenlabs" || provider === "heygen")) {
    // Un fallo de sync de catálogo no debe deshacer una conexión válida —
    // el usuario ya está "conectado", el catálogo se reintenta al verificar.
    await syncCatalog(supabase, workspaceId, provider, trimmedKey).catch(() => null);
    await refreshVoiceLinkStatus(supabase, workspaceId).catch(() => null);
  }

  revalidatePath("/integrations");
  return {
    ok: true,
    status: verification.status,
    missingPermission: verification.missingPermission,
    amber: verification.amber,
  };
}

export async function verifyIntegration(
  provider: IntegrationProvider,
): Promise<IntegrationActionResult> {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);
  if (!workspaceId) return { ok: false, reason: "no_workspace" };

  const { data: row } = await supabase
    .from("integrations")
    .select("ciphertext, iv, auth_tag, key_version")
    .eq("workspace_id", workspaceId)
    .eq("provider", provider)
    .single();

  if (!row) return { ok: false, reason: "save_failed" };

  let apiKey: string;
  let verification: ProviderVerification;
  try {
    apiKey = decryptSecret(row);
    verification = await verifyProviderKey(provider, apiKey);
  } catch {
    return { ok: false, reason: "verification_failed" };
  }

  const { error } = await supabase
    .from("integrations")
    .update({
      status: verification.status,
      last_verified_at: new Date().toISOString(),
      scopes_json: verification.scopes,
    })
    .eq("workspace_id", workspaceId)
    .eq("provider", provider);

  if (error) return { ok: false, reason: "save_failed" };

  if (verification.status === "active" && (provider === "elevenlabs" || provider === "heygen")) {
    // "Comprobar" también repara un catálogo que haya quedado vacío por un
    // sync fallido en la conexión original (docs/03: el saldo/estado se
    // revalida, y el catálogo debe poder recuperarse sin desconectar).
    await syncCatalog(supabase, workspaceId, provider, apiKey).catch(() => null);
    await refreshVoiceLinkStatus(supabase, workspaceId).catch(() => null);
  }

  revalidatePath("/integrations");
  return {
    ok: true,
    status: verification.status,
    missingPermission: verification.missingPermission,
    amber: verification.amber,
  };
}

export async function disconnectIntegration(
  provider: IntegrationProvider,
): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const workspaceId = await getCurrentWorkspaceId(supabase);
  if (!workspaceId) return { ok: false };

  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("provider", provider);

  if (!error && (provider === "elevenlabs" || provider === "heygen")) {
    // El estado de vinculación queda obsoleto en cuanto cualquiera de los
    // dos proveedores se desconecta — se limpia en vez de mostrar un
    // "Vinculada" que ya no es cierto.
    await supabase
      .from("integrations")
      .update({ linked_json: null })
      .eq("workspace_id", workspaceId)
      .eq("provider", "elevenlabs");
  }

  revalidatePath("/integrations");
  return { ok: !error };
}
