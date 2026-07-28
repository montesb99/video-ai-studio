import "server-only";
import { fetchWithRetry } from "./http";

// docs/03-INTEGRATIONS.md §2 — HeyGen es BYOK y crítico (paso 6: avatar).

const BASE_URL = "https://api.heygen.com";

/**
 * Único modelo de avatar soportado por la plataforma — fijo, sin selector.
 * Regla dura de CLAUDE.md: "Avatar III es el único modelo de HeyGen", fijo
 * como constante aquí, nunca leído de la base de datos ni expuesto en la UI.
 */
export const AVATAR_MODEL = "avatar_iii" as const;

export type HeygenPermission = "list_avatars" | "credits";

export type HeygenVerifyResult = {
  status: "active" | "invalid" | "unverified";
  missingPermission?: HeygenPermission;
  amber?: "no_credits" | "rate_limited";
  scopes: { listAvatars: boolean; hasCredits: boolean; remainingQuota?: number };
};

/**
 * NOTA para quien revise este archivo (api-architect): `GET /v2/avatars` y
 * `GET /v2/user/remaining_quota` son los endpoints v2 conocidos para listar
 * avatares y consultar créditos — a diferencia de `/v3/videos` y `/v3/assets`
 * (docs/03-INTEGRATIONS.md líneas 205-243), estos dos NO se verificaron
 * contra la API real en el Spike 0. Confirmar contra developers.heygen.com
 * antes de dar el sprint por cerrado; si cambiaron de path o de forma de
 * respuesta, es el único ajuste que hace falta — el resto del archivo no
 * depende de la forma exacta del payload.
 */
export async function verifyKey(apiKey: string): Promise<HeygenVerifyResult> {
  const [avatarsRes, quotaRes] = await Promise.all([
    fetchWithRetry(
      `${BASE_URL}/v2/avatars`,
      { headers: { "X-Api-Key": apiKey } },
      { maxAttempts: 2 },
    ),
    fetchWithRetry(
      `${BASE_URL}/v2/user/remaining_quota`,
      { headers: { "X-Api-Key": apiKey } },
      { maxAttempts: 2 },
    ),
  ]);

  if (avatarsRes.status === 401 || avatarsRes.status === 403) {
    return {
      status: "invalid",
      missingPermission: "list_avatars",
      scopes: { listAvatars: false, hasCredits: false },
    };
  }
  if (avatarsRes.status === 429 || quotaRes.status === 429) {
    return {
      status: "active",
      amber: "rate_limited",
      scopes: { listAvatars: avatarsRes.ok, hasCredits: quotaRes.ok },
    };
  }
  if (!avatarsRes.ok) {
    return { status: "unverified", scopes: { listAvatars: false, hasCredits: false } };
  }
  if (!quotaRes.ok) {
    // El listado de avatares ya probó que la clave es válida. El saldo se
    // vuelve a comprobar antes de generar el video (docs/03 línea 81), así
    // que un fallo puntual aquí no bloquea la conexión.
    return { status: "active", scopes: { listAvatars: true, hasCredits: false } };
  }

  const quotaBody = await quotaRes.json().catch(() => null);
  const remaining = quotaBody?.data?.remaining_quota;
  const remainingQuota = typeof remaining === "number" ? remaining : undefined;
  const hasCredits = typeof remaining === "number" ? remaining > 0 : true;

  if (!hasCredits) {
    return {
      status: "active",
      amber: "no_credits",
      scopes: { listAvatars: true, hasCredits: false, remainingQuota },
    };
  }

  return { status: "active", scopes: { listAvatars: true, hasCredits: true, remainingQuota } };
}

export type HeygenAvatar = {
  providerId: string;
  name: string;
  thumbUrl: string | null;
};

export async function listAvatars(apiKey: string): Promise<HeygenAvatar[]> {
  const response = await fetchWithRetry(
    `${BASE_URL}/v2/avatars`,
    { headers: { "X-Api-Key": apiKey } },
    { maxAttempts: 2 },
  );
  if (!response.ok) {
    throw new Error(`HeyGen listAvatars falló con status ${response.status}`);
  }
  const body = await response.json();
  const avatars = (body?.data?.avatars ?? []) as Array<Record<string, unknown>>;

  return avatars.map((avatar) => ({
    providerId: avatar.avatar_id as string,
    name: (avatar.avatar_name as string) ?? (avatar.avatar_id as string),
    thumbUrl: (avatar.preview_image_url as string) ?? null,
  }));
}

/**
 * Intenta que HeyGen use la clave de ElevenLabs del workspace para el Modo B
 * (voz vinculada, docs/03-INTEGRATIONS.md §2b). Devuelve `linked: false`
 * cuando no hay endpoint de provisión por API — en ese caso el flujo cae al
 * modo guiado (copiar clave / abrir HeyGen / "ya lo hice, comprobar") que
 * construye la UI de integraciones.
 */
export async function provisionVoiceProvider(
  _heygenApiKey: string,
  _elevenLabsApiKey: string,
): Promise<{ linked: boolean; method: "api" | "manual" }> {
  // TODO(api-architect): confirmar si existe un endpoint público para
  // registrar la clave de ElevenLabs de un tercero en HeyGen. Documentado
  // como "lo que no sé todavía" en docs/03 línea 317 — hasta confirmarlo se
  // asume que no existe y el Modo B siempre requiere el paso manual.
  return { linked: false, method: "manual" };
}
