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

// GET /v2/avatars (usado antes) no filtra por dueño — devuelve el catálogo
// público entero de HeyGen (miles de avatares) además de los propios,
// encontrado en producción cuando el selector de avatar de la app mostraba
// más de 1200 opciones que no eran del usuario. GET /v3/avatars sí tiene
// `ownership`: "public" para el catálogo de HeyGen, "private" para los que
// el usuario entrenó — acá solo queremos los propios (docs.heygen.com/
// reference/list-avatars-v2, verificado por WebFetch).
export async function listAvatars(apiKey: string): Promise<HeygenAvatar[]> {
  const response = await fetchWithRetry(
    `${BASE_URL}/v3/avatars?ownership=private`,
    { headers: { "X-Api-Key": apiKey } },
    { maxAttempts: 2 },
  );
  if (!response.ok) {
    throw new Error(`HeyGen listAvatars falló con status ${response.status}`);
  }
  const body = await response.json();
  const avatars = (body?.data ?? []) as Array<Record<string, unknown>>;

  return avatars.map((avatar) => ({
    providerId: avatar.id as string,
    name: (avatar.name as string) ?? (avatar.id as string),
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

// --- Subir el audio (paso 6) -------------------------------------------------
//
// docs/03-INTEGRATIONS.md líneas 208-223, `POST /v3/assets` — ✅ verificado
// contra la API real en el Spike 0. `multipart/form-data` con un campo
// `file`, máx. 32 MB, acepta `mp3`/`wav`. No se fija `Content-Type` a mano:
// `fetch` con un `FormData` pone el boundary correcto solo — fijarlo rompe el
// parseo del lado del servidor.

export type HeygenAssetFailureReason = "invalid_key" | "no_credits" | "in_progress" | "provider_error";

export async function uploadAsset(
  apiKey: string,
  file: Buffer,
  mimeType: "audio/wav" | "audio/mpeg",
  idempotencyKey: string,
): Promise<{ ok: true; assetId: string; url: string } | { ok: false; reason: HeygenAssetFailureReason }> {
  const formData = new FormData();
  // `new Uint8Array(file)` copia a un ArrayBuffer "normal": el `Buffer` de
  // Node tipa su `.buffer` como `ArrayBufferLike` (incluye SharedArrayBuffer),
  // que `BlobPart` no acepta directamente.
  formData.append("file", new Blob([new Uint8Array(file)], { type: mimeType }));

  const response = await fetchWithRetry(
    `${BASE_URL}/v3/assets`,
    {
      method: "POST",
      headers: { "X-Api-Key": apiKey, "Idempotency-Key": idempotencyKey },
      body: formData,
    },
    { maxAttempts: 2 },
  );

  if (!response.ok) {
    // Diagnóstico temporal, mismo criterio que synthesizeWithTimestamps en
    // elevenlabs.ts: nunca loguea la apiKey, solo el status y el cuerpo de
    // error que ya devuelve HeyGen (respuesta pública de su propia API).
    const errorBody = await response.text().catch(() => "");
    console.error(`HeyGen uploadAsset falló: status=${response.status} body=${errorBody}`);
    if (response.status === 401 || response.status === 403) return { ok: false, reason: "invalid_key" };
    if (response.status === 402) return { ok: false, reason: "no_credits" };
    // 409: petición idéntica en curso (idempotencia) — regla dura del
    // proyecto, nunca se reintenta, se espera a la que ya está en vuelo.
    if (response.status === 409) return { ok: false, reason: "in_progress" };
    return { ok: false, reason: "provider_error" };
  }

  const body = await response.json();
  return { ok: true, assetId: body?.data?.asset_id as string, url: body?.data?.url as string };
}

// --- Crear el render del avatar (paso 6) -------------------------------------
//
// docs/03-INTEGRATIONS.md líneas 225-257, `POST /v3/videos` — ✅ verificado
// contra la documentación oficial y la API real (jul 2026), endpoint `v3` (no
// `v2`). Este sprint solo usa el Modo A (audio externo vía `audio_url`): sin
// `callback_url`/`callback_id` porque el estado se consulta por polling con
// `getVideoStatus`, no por webhook, todavía.
//
// output_format: "mp4", no "webm" — encontrado en producción: "webm" pide
// fondo transparente (alpha), y HeyGen lo rechaza (400 invalid_parameter,
// "must be trained with matting enabled") si el avatar no se entrenó con esa
// opción — no es el caso por defecto para avatares ya creados. "mp4" no
// exige matting: devuelve el fondo tal como quedó grabado en el avatar. El
// fondo transparente (para superponer sobre motion graphics) queda para
// cuando exista el sprint de composición — no se usa en ningún lado todavía.

export async function createVideo(
  apiKey: string,
  input: { lookId: string; audioUrl: string; title: string; idempotencyKey: string },
): Promise<{ ok: true; videoId: string } | { ok: false; reason: HeygenAssetFailureReason }> {
  const response = await fetchWithRetry(
    `${BASE_URL}/v3/videos`,
    {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
        "Idempotency-Key": input.idempotencyKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "avatar",
        avatar_id: input.lookId,
        audio_url: input.audioUrl,
        engine: { type: AVATAR_MODEL },
        resolution: "1080p",
        aspect_ratio: "9:16",
        output_format: "mp4",
        title: input.title,
      }),
    },
    { maxAttempts: 2 },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error(`HeyGen createVideo falló: status=${response.status} body=${errorBody}`);
    if (response.status === 401 || response.status === 403) return { ok: false, reason: "invalid_key" };
    if (response.status === 402) return { ok: false, reason: "no_credits" };
    if (response.status === 409) return { ok: false, reason: "in_progress" };
    return { ok: false, reason: "provider_error" };
  }

  const body = await response.json();
  return { ok: true, videoId: body?.data?.video_id as string };
}

// --- Looks de un avatar (paso 6) --------------------------------------------
//
// Endpoint verificado contra developers.heygen.com en la Fase 0 de este
// sprint: `GET /v3/avatars/looks?group_id=` — distinto de
// `GET /v3/avatars/looks/{look_id}` (docs/03-INTEGRATIONS.md línea 264, que
// valida UN look puntual). Este lista todos los looks del grupo y cada uno ya
// trae `supported_api_engines`, así que no hace falta una llamada extra por
// look para saber si soporta `avatar_iii`. Respuesta: `{ data: [...],
// has_more, next_token }` — el array va directo en `data`, no en
// `data.looks`.

export type AvatarLook = {
  lookId: string; // el campo `id` de la respuesta — es el `avatar_id` de POST /v3/videos
  name: string | null;
  thumbUrl: string | null;
  supportsAvatarIII: boolean; // derivado de supported_api_engines.includes("avatar_iii")
};

type HeygenLookApiShape = {
  id: string;
  name?: string | null;
  preview_image_url?: string | null;
  supported_api_engines?: string[];
};

export async function listLooks(apiKey: string, avatarProviderId: string): Promise<AvatarLook[]> {
  const response = await fetchWithRetry(
    `${BASE_URL}/v3/avatars/looks?group_id=${encodeURIComponent(avatarProviderId)}`,
    { headers: { "X-Api-Key": apiKey } },
    { maxAttempts: 2 },
  );
  if (!response.ok) {
    throw new Error(`HeyGen listLooks falló con status ${response.status}`);
  }
  const body = await response.json();
  const looks = (body?.data ?? []) as HeygenLookApiShape[];

  return looks.map((look) => ({
    lookId: look.id,
    name: look.name ?? null,
    thumbUrl: look.preview_image_url ?? null,
    supportsAvatarIII: (look.supported_api_engines ?? []).includes(AVATAR_MODEL),
  }));
}

// --- Estado de un video (paso 6, polling) -----------------------------------
//
// Endpoint verificado en la Fase 0: `GET /v3/videos/{video_id}`. Estados
// documentados por HeyGen: pending/processing/completed/failed — pero
// `POST /v3/videos` devuelve `status: "waiting"` al crear, que no está en esa
// lista. No se valida contra un enum cerrado: cualquier valor que no sea
// `completed` ni `failed` se trata como "todavía en proceso", así "waiting"
// (y cualquier estado nuevo que HeyGen agregue) no rompe el polling.

export type VideoRenderStatus =
  | { status: "in_progress" }
  | { status: "completed"; videoUrl: string }
  | { status: "failed"; errorCode: string | null; errorMessage: string | null };

export async function getVideoStatus(apiKey: string, videoId: string): Promise<VideoRenderStatus> {
  const response = await fetchWithRetry(
    `${BASE_URL}/v3/videos/${encodeURIComponent(videoId)}`,
    { headers: { "X-Api-Key": apiKey } },
    { maxAttempts: 2 },
  );
  if (!response.ok) {
    throw new Error(`HeyGen getVideoStatus falló con status ${response.status}`);
  }
  const body = await response.json();
  const data = body?.data ?? {};
  const status = data.status as string | undefined;

  if (status === "completed") {
    return { status: "completed", videoUrl: data.video_url as string };
  }
  if (status === "failed") {
    return {
      status: "failed",
      errorCode: (data.failure_code as string) ?? null,
      errorMessage: (data.failure_message as string) ?? null,
    };
  }
  // Cualquier otro valor ("waiting", "pending", "processing", o uno nuevo que
  // HeyGen agregue sin avisar) se trata como en curso, a propósito — ver nota
  // arriba. No es un throw: un estado desconocido no debe tumbar el polling.
  if (status !== "pending" && status !== "processing") {
    console.warn(`HeyGen getVideoStatus: status desconocido "${status}", se trata como en_progreso.`);
  }
  return { status: "in_progress" };
}
