import "server-only";
import { fetchWithRetry } from "./http";

// docs/03-INTEGRATIONS.md §1 — ElevenLabs es BYOK y crítico (paso 4: audio +
// tiempos por palabra). La verificación prueba cada permiso por separado,
// no solo "¿responde 200?" (caso real del Spike 0: clave válida con 401
// missing_permissions en text_to_speech).

const BASE_URL = "https://api.elevenlabs.io/v1";

type PermissionResult = { ok: boolean; missing: boolean; rateLimited: boolean; body: unknown };

type ElevenLabsErrorBody = {
  detail?: { status?: string; message?: string };
};

async function checkPermission(
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<PermissionResult> {
  const response = await fetchWithRetry(
    `${BASE_URL}${path}`,
    { ...init, headers: { "xi-api-key": apiKey, ...(init?.headers ?? {}) } },
    { maxAttempts: 2 },
  );

  if (response.ok) {
    const body = await response.json().catch(() => null);
    return { ok: true, missing: false, rateLimited: false, body };
  }
  if (response.status === 429) return { ok: false, missing: false, rateLimited: true, body: null };
  if (response.status === 401 || response.status === 403) {
    const body = (await response.json().catch(() => null)) as ElevenLabsErrorBody | null;
    const missing = body?.detail?.status === "missing_permissions";
    return { ok: false, missing, rateLimited: false, body };
  }
  return { ok: false, missing: false, rateLimited: false, body: null };
}

export type ElevenLabsPermission =
  | "user_read"
  | "voices_read"
  | "models_read"
  | "text_to_speech";

export type ElevenLabsVerifyResult = {
  status: "active" | "invalid" | "unverified";
  missingPermission?: ElevenLabsPermission;
  amber?: "rate_limited";
  scopes: Record<ElevenLabsPermission, boolean>;
};

/**
 * Verifica la clave probando los 4 permisos que necesita el pipeline.
 *
 * NOTA para quien revise este archivo (api-architect): `text_to_speech` no
 * tiene forma de comprobarse sin una llamada real de síntesis — se hace con
 * el modelo más barato (`eleven_flash_v2_5`) y un texto de una palabra, y
 * solo se intenta si los otros tres permisos ya pasaron, para no gastar en
 * una clave que de todas formas va a fallar. Confirmar que esto sigue siendo
 * lo más barato disponible antes de dar el sprint por cerrado.
 */
export async function verifyKey(apiKey: string): Promise<ElevenLabsVerifyResult> {
  const [user, voices, models] = await Promise.all([
    checkPermission(apiKey, "/user"),
    checkPermission(apiKey, "/voices"),
    checkPermission(apiKey, "/models"),
  ]);

  const scopes: Record<ElevenLabsPermission, boolean> = {
    user_read: user.ok,
    voices_read: voices.ok,
    models_read: models.ok,
    text_to_speech: false,
  };

  let textToSpeech: PermissionResult | null = null;
  if (user.ok && voices.ok && models.ok) {
    // Reutiliza el body ya obtenido por checkPermission("/voices") arriba —
    // antes se volvía a pedir /v1/voices con un `fetch` suelto (sin retry y
    // sin necesidad: el permiso ya se había comprobado dos líneas antes).
    const firstVoiceId = (voices.body as { voices?: Array<{ voice_id?: string }> } | null)
      ?.voices?.[0]?.voice_id;

    if (firstVoiceId) {
      textToSpeech = await checkPermission(apiKey, `/text-to-speech/${firstVoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Hola", model_id: "eleven_flash_v2_5" }),
      });
      scopes.text_to_speech = textToSpeech.ok;
    }
  }

  const anyRateLimited =
    user.rateLimited || voices.rateLimited || models.rateLimited || textToSpeech?.rateLimited;
  if (anyRateLimited) {
    return { status: "active", amber: "rate_limited", scopes };
  }

  const checks: Array<{ permission: ElevenLabsPermission; result: PermissionResult }> = [
    { permission: "user_read", result: user },
    { permission: "voices_read", result: voices },
    { permission: "models_read", result: models },
    ...(textToSpeech ? [{ permission: "text_to_speech" as const, result: textToSpeech }] : []),
  ];

  const missing = checks.find(({ result }) => !result.ok);
  if (missing) {
    return { status: "invalid", missingPermission: missing.permission, scopes };
  }

  if (!textToSpeech) {
    return { status: "unverified", scopes };
  }

  return { status: "active", scopes };
}

export type ElevenLabsVoice = {
  providerId: string;
  name: string;
  isCloned: boolean;
  category: string | null;
  labels: Record<string, string>;
  previewUrl: string | null;
};

export async function listVoices(apiKey: string): Promise<ElevenLabsVoice[]> {
  const response = await fetchWithRetry(
    `${BASE_URL}/voices`,
    { headers: { "xi-api-key": apiKey } },
    { maxAttempts: 2 },
  );
  if (!response.ok) {
    throw new Error(`ElevenLabs listVoices falló con status ${response.status}`);
  }
  const body = await response.json();
  const voices = (body.voices ?? []) as Array<Record<string, unknown>>;

  return voices.map((voice) => ({
    providerId: voice.voice_id as string,
    name: voice.name as string,
    isCloned: voice.category === "cloned",
    category: (voice.category as string) ?? null,
    labels: (voice.labels as Record<string, string>) ?? {},
    previewUrl: (voice.preview_url as string) ?? null,
  }));
}
