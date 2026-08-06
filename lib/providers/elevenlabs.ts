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

// --- Síntesis con tiempos por palabra (paso 4) ------------------------------
//
// docs/03-INTEGRATIONS.md §1 "El detalle que sostiene todo": el endpoint
// `with-timestamps` es la única llamada del pipeline que produce audio Y
// alineación en una sola petición. Contrato verificado en la Fase 0 de este
// sprint (no reverificar):
//   - `output_format` va en la QUERY STRING, nunca en el body — si se pone en
//     el body la API lo ignora en silencio y devuelve mp3 por defecto.
//   - `pcm_24000` en vez de `pcm_44100`: este último exige plan Pro+ y la
//     clave es BYOK de tier desconocido. pcm_24000 no tiene restricción de
//     tier y alcanza para voz hablada (no música).
//   - Se usa `alignment` (no `normalized_alignment`) para los tiempos reales.

export type WordCue = { w: string; t0: number; t1: number };

export type VoiceSettingsInput = {
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
};

export type TtsResult = {
  pcm: Buffer; // PCM crudo 16-bit signed LE, mono, 24000 Hz
  sampleRate: 24000;
  words: WordCue[];
  durationSeconds: number;
};

export type TtsFailureReason = "invalid_key" | "no_credits" | "rate_limited" | "provider_error";

type ElevenLabsTtsAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

type ElevenLabsTtsResponseBody = {
  audio_base64: string;
  alignment: ElevenLabsTtsAlignment;
  normalized_alignment?: ElevenLabsTtsAlignment;
};

/**
 * Deriva las palabras de la alineación por carácter: acumula caracteres hasta
 * encontrar un espacio (el separador de palabra), usando el `t0` del primer
 * carácter y el `t1` del último. Los espacios no son parte de ninguna
 * palabra — la puntuación pegada a una palabra (comas, puntos) sí lo es.
 */
function deriveWordCues(alignment: ElevenLabsTtsAlignment): WordCue[] {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } =
    alignment;
  const words: WordCue[] = [];
  let current: { chars: string[]; t0: number } | null = null;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    if (char === " ") {
      if (current) {
        words.push({ w: current.chars.join(""), t0: current.t0, t1: ends[i - 1] });
        current = null;
      }
      continue;
    }
    if (!current) {
      current = { chars: [char], t0: starts[i] };
    } else {
      current.chars.push(char);
    }
  }
  if (current) {
    words.push({ w: current.chars.join(""), t0: current.t0, t1: ends[characters.length - 1] });
  }

  return words;
}

export async function synthesizeWithTimestamps(
  apiKey: string,
  voiceId: string,
  text: string,
  settings: VoiceSettingsInput,
): Promise<{ ok: true; data: TtsResult } | { ok: false; reason: TtsFailureReason }> {
  const response = await fetchWithRetry(
    `${BASE_URL}/text-to-speech/${voiceId}/with-timestamps?output_format=pcm_24000`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          style: settings.style,
          speed: settings.speed,
          use_speaker_boost: true,
        },
      }),
    },
    { maxAttempts: 2 },
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) return { ok: false, reason: "invalid_key" };
    if (response.status === 402) return { ok: false, reason: "no_credits" };
    if (response.status === 429) return { ok: false, reason: "rate_limited" };
    return { ok: false, reason: "provider_error" };
  }

  const body = (await response.json()) as ElevenLabsTtsResponseBody;
  const pcm = Buffer.from(body.audio_base64, "base64");
  const sampleRate = 24000 as const;
  const words = deriveWordCues(body.alignment);
  // Duración a partir del PCM real (16-bit = 2 bytes/muestra), no de la
  // alineación: es correcta aunque `alignment` venga vacío (texto sin
  // caracteres alineables) y refleja el silencio final que a veces añade el
  // proveedor después del último carácter.
  const durationSeconds = pcm.length / 2 / sampleRate;

  return { ok: true, data: { pcm, sampleRate, words, durationSeconds } };
}
