import "server-only";
import { fetchWithRetry } from "./http";
import type { StructuredCallInput, StructuredCallResult } from "./llm-types";

// docs/03-INTEGRATIONS.md - Gemini es la alternativa BYOK gratuita a Claude
// para ideacion/guion (Sprint 3 Parte E): el workspace puede conectar una
// clave de Google AI Studio (tier gratuito, sin tarjeta) en /integrations.
// Prioridad de resolucion en lib/pipeline/llm-provider.ts#resolveGenerator:
// BYOK Anthropic > BYOK Gemini > ANTHROPIC_API_KEY de plataforma.
//
// Verificado en vivo contra la API real (no asumido de memoria) el 4-ago-2026:
//   - Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
//     (API "Generate Content", hoy documentada como "Legacy" frente a la nueva
//     Interactions API de Google -- ai.google.dev/gemini-api/docs/interactions-overview
//     -- pero sigue soportada y sigue recibiendo los modelos "mainline" segun
//     ai.google.dev/gemini-api/docs/migrate-to-interactions. Se eligio esta
//     por ser la forma estable de una sola llamada sin estado de conversacion
//     en servidor, igual que /v1/messages de Claude en este mismo directorio.)
//   - Auth: header x-goog-api-key (confirmado con una clave invalida real:
//     devuelve 400 con body {"error":{"code":400,"status":"INVALID_ARGUMENT",
//     "details":[{"reason":"API_KEY_INVALID"}]}} -- NO 401. Hay que mapear
//     400+API_KEY_INVALID a "invalid", no un 401 que esta API no usa para esto).
//   - Salida estructurada: generationConfig.responseMimeType = "application/json"
//     + generationConfig.responseSchema -- confirmado contra
//     ai.google.dev/gemini-api/docs/structured-output. responseSchema es un
//     subconjunto de OpenAPI 3.0 (NO el JSON Schema que usa el resto del
//     pipeline): "type" en mayusculas ("OBJECT"/"STRING"/"ARRAY"/...) y sin
//     soporte de $ref/$defs en esta variante estable -- de ahi
//     toGeminiSchema() mas abajo, que resuelve los $ref de
//     lib/pipeline/schemas.ts contra su propio $defs antes de enviar nada.
//     (Google anuncio en su blog soporte mas amplio de JSON Schema, incluido
//     $ref, via un campo nuevo response_json_schema, pero sin un ejemplo
//     curl verificable de forma independiente al momento de escribir esto;
//     se prefirio responseSchema, la forma con documentacion estable y
//     contrastada. Revisar si conviene migrar cuando esa via tenga ejemplos
//     oficiales confirmados.)
//   - Reintentos: mismo criterio que el resto de proveedores via fetchWithRetry.

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// gemini-2.5-flash: modelo estable (no preview) confirmado en el tier
// gratuito de Google AI Studio (1500 solicitudes/dia, 15 RPM, hasta 1M TPM --
// ai.google.dev/gemini-api/docs/rate-limits y ai.google.dev/gemini-api/docs/pricing,
// ago-2026). gemini-2.0-flash (el otro candidato considerado) quedo
// descartado: deprecado el 18-feb-2026, apagado el 1-jun-2026. Existen
// familias mas nuevas (gemini-3.x-flash) tambien listadas en el tier
// gratuito, pero en su mayoria "-preview" -- se prefirio 2.5-flash por ser
// GA y no preview para una integracion de produccion; revisar cuando
// gemini-3-flash tenga un release estable sin sufijo preview.
export const GEMINI_FLASH = "gemini-2.5-flash" as const;

type GeminiPart = { text: string };
type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

type JsonSchemaNode = Record<string, unknown>;

function toGeminiType(jsonSchemaType: string): string {
  switch (jsonSchemaType) {
    case "object":
      return "OBJECT";
    case "array":
      return "ARRAY";
    case "string":
      return "STRING";
    case "integer":
      return "INTEGER";
    case "number":
      return "NUMBER";
    case "boolean":
      return "BOOLEAN";
    case "null":
      return "NULL";
    default:
      throw new Error(`toGeminiSchema: tipo JSON Schema no soportado: ${jsonSchemaType}`);
  }
}

/**
 * Convierte JSON Schema estandar (el que ya usa lib/pipeline/schemas.ts, con
 * $ref/$defs y "type" en minusculas) al subconjunto de OpenAPI que exige
 * responseSchema de Gemini. Resuelve cada $ref: "#/$defs/x" inline contra
 * los $defs del propio esquema raiz -- Gemini no entiende referencias, asi
 * que el caller nunca tiene que mantener dos copias del esquema a mano.
 */
export function toGeminiSchema(schemaJson: JsonSchemaNode): Record<string, unknown> {
  const defs = (schemaJson.$defs as Record<string, JsonSchemaNode> | undefined) ?? {};

  function convert(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(convert);
    if (node === null || typeof node !== "object") return node;

    const obj = node as JsonSchemaNode;

    if (typeof obj.$ref === "string") {
      const refName = obj.$ref.replace(/^#\/\$defs\//, "");
      const target = defs[refName];
      if (!target) {
        throw new Error(`toGeminiSchema: no se pudo resolver ${obj.$ref} contra $defs`);
      }
      return convert(target);
    }

    const out: Record<string, unknown> = {};

    const rawType = obj.type;
    if (Array.isArray(rawType)) {
      // Forma type: ["string", "null"] que usa p.ej. proposalsSchema para
      // campos opcionales -- Gemini no soporta type-array, usa "nullable".
      const nonNull = rawType.find((t) => t !== "null");
      if (typeof nonNull === "string") out.type = toGeminiType(nonNull);
      if (rawType.includes("null")) out.nullable = true;
    } else if (typeof rawType === "string") {
      out.type = toGeminiType(rawType);
    }

    if (obj.properties && typeof obj.properties === "object") {
      const props: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj.properties as Record<string, unknown>)) {
        props[key] = convert(value);
      }
      out.properties = props;
      // Hint propio de Gemini (no existe en JSON Schema estandar): fija el
      // orden en que el modelo emite los campos del objeto, mismo orden que
      // declaramos en schemas.ts -- mejora la consistencia de la salida.
      out.propertyOrdering = Object.keys(props);
    } else if (out.type === "OBJECT") {
      // `{ type: "object" }` sin `properties` -- es el caso de
      // `onScreen: z.record(z.string(), z.unknown())` en blockSchema (bloque
      // por bloque, docs/07-METODOLOGIA-GUION.md §3-bis): un objeto libre,
      // no un objeto vacio. `additionalProperties` es soportado por la API
      // de Gemini desde nov-2025; sin fijarlo aqui, un OBJECT sin
      // `properties` puede terminar siempre generando `{}` porque el modelo
      // no tiene forma de saber que claves llenar. Confirmado via
      // ai.google.dev + github.com/googleapis/python-genai#1815.
      out.additionalProperties = true;
    }

    if (typeof obj.additionalProperties === "boolean") {
      out.additionalProperties = obj.additionalProperties;
    } else if (obj.additionalProperties && typeof obj.additionalProperties === "object") {
      out.additionalProperties = convert(obj.additionalProperties);
    }

    if (Array.isArray(obj.required)) out.required = obj.required;
    if (obj.items !== undefined) out.items = convert(obj.items);
    if (Array.isArray(obj.enum)) out.enum = obj.enum;
    if (typeof obj.minItems === "number") out.minItems = obj.minItems;
    if (typeof obj.maxItems === "number") out.maxItems = obj.maxItems;
    if (typeof obj.minLength === "number") out.minLength = obj.minLength;
    if (typeof obj.maxLength === "number") out.maxLength = obj.maxLength;
    if (typeof obj.minimum === "number") out.minimum = obj.minimum;
    if (typeof obj.maximum === "number") out.maximum = obj.maximum;
    if (typeof obj.description === "string") out.description = obj.description;

    return out;
  }

  // No hace falta quitar `$defs` antes de convertir: `convert()` sólo copia
  // a `out` los campos de Schema que reconoce explícitamente, así que la
  // clave `$defs` del nodo raíz simplemente nunca se lee ni se reenvía.
  return convert(schemaJson) as Record<string, unknown>;
}

type GeminiCallOutcome =
  | { ok: true; input: unknown }
  | { ok: false; reason: "invalid_json" | "http_error" | "blocked" | "rate_limited" };

const BLOCKED_FINISH_REASONS = new Set([
  "SAFETY",
  "RECITATION",
  "BLOCKLIST",
  "PROHIBITED_CONTENT",
  "SPII",
]);

async function callOnce(
  apiKey: string,
  model: string,
  system: string,
  contents: GeminiContent[],
  responseSchema: Record<string, unknown>,
  maxTokens: number,
): Promise<GeminiCallOutcome> {
  const response = await fetchWithRetry(
    `${BASE_URL}/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
          maxOutputTokens: maxTokens,
          // gemini-2.5-flash tiene "thinking" dinámico activado por defecto,
          // y esos tokens de razonamiento se descuentan del mismo
          // maxOutputTokens que la salida real -- sin esto, una respuesta
          // puede agotar el presupuesto pensando y terminar en
          // finishReason "MAX_TOKENS" con el JSON vacío. La tarea acá es
          // salida estructurada determinista contra un schema, no
          // razonamiento abierto, así que se desactiva.
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    },
    { maxAttempts: 2 },
  );

  if (response.status === 429) return { ok: false, reason: "rate_limited" };
  if (!response.ok) return { ok: false, reason: "http_error" };

  const body = (await response.json().catch(() => null)) as {
    promptFeedback?: { blockReason?: string };
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string }> };
    }>;
  } | null;

  if (body?.promptFeedback?.blockReason) return { ok: false, reason: "blocked" };

  const candidate = body?.candidates?.[0];
  if (candidate?.finishReason && BLOCKED_FINISH_REASONS.has(candidate.finishReason)) {
    return { ok: false, reason: "blocked" };
  }

  const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) return { ok: false, reason: "invalid_json" };

  try {
    return { ok: true, input: JSON.parse(text) };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}

/**
 * Fuerza la salida a JSON valido contra input.schemaJson via responseSchema
 * de Gemini (nunca se parsea prosa/markdown). Misma forma exacta que
 * claude.ts#generateStructured -- ver lib/providers/llm-types.ts. Si el
 * primer intento no valida contra input.schema (zod), reintenta mostrandole
 * al modelo su propio intento y el motivo del rechazo, hasta maxAttempts.
 * Nunca loguea userContent ni la respuesta cruda.
 */
export async function generateStructured<T>(
  input: StructuredCallInput<T>,
): Promise<StructuredCallResult<T>> {
  if (!input.apiKey) return { ok: false, reason: "not_configured" };

  const maxAttempts = input.maxAttempts ?? 2;
  const responseSchema = toGeminiSchema(input.schemaJson);
  const contents: GeminiContent[] = [{ role: "user", parts: [{ text: input.userContent }] }];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await callOnce(
      input.apiKey,
      input.model,
      input.system,
      contents,
      responseSchema,
      input.maxTokens ?? 4096,
    );

    if (!result.ok) {
      if (result.reason === "rate_limited" || result.reason === "blocked") return result;
      if (attempt === maxAttempts - 1) return result;
      continue;
    }

    const parsed = input.schema.safeParse(result.input);
    if (parsed.success) return { ok: true, data: parsed.data };

    if (attempt === maxAttempts - 1) return { ok: false, reason: "invalid_json" };

    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    contents.push(
      { role: "model", parts: [{ text: JSON.stringify(result.input) }] },
      {
        role: "user",
        parts: [
          {
            text: `Tu respuesta anterior no cumplio el esquema (${issues}). Corregila y volve a responder solo con el JSON completo.`,
          },
        ],
      },
    );
  }

  return { ok: false, reason: "invalid_json" };
}

export type GeminiVerifyResult = {
  status: "active" | "invalid" | "unverified";
  amber?: "no_credits" | "rate_limited";
  scopes: { scriptGeneration: boolean };
};

/**
 * Llamada real minima (maxOutputTokens bajo, sin responseSchema) para
 * validar la clave. Estados confirmados contra la API real (no asumidos de
 * memoria, probado el 4-ago-2026 con una clave invalida):
 *   - Clave invalida: HTTP 400 (NO 401) con
 *     error.details[0].reason === "API_KEY_INVALID".
 *   - Sin acceso al proyecto/API no habilitada: 403 PERMISSION_DENIED.
 *   - Limite del tier gratuito: 429 con status "RESOURCE_EXHAUSTED". Google
 *     no distingue con un codigo propio la cuota diaria agotada (equivalente
 *     a "sin credito" en un proveedor de pago) del limite de rafaga por
 *     minuto -- ambos son 429 RESOURCE_EXHAUSTED. Se diferencian por el
 *     quota_metric/quota_id en error.details[].metadata: si menciona cuota
 *     diaria ("PerDay"/"free_tier"/"daily"), se mapea a "no_credits" (hay
 *     que esperar al reset diario, no reintentar ahora); si no, a
 *     "rate_limited" (rafaga, reintentar en segundos).
 */
export async function verifyKey(apiKey: string): Promise<GeminiVerifyResult> {
  const response = await fetchWithRetry(
    `${BASE_URL}/${GEMINI_FLASH}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "ping" }] }],
        // thinkingBudget: 0 por el mismo motivo que en callOnce -- sin esto,
        // este ping mínimo puede terminar en MAX_TOKENS por el thinking
        // dinámico y no decir nada real sobre si la clave sirve para generar.
        generationConfig: { maxOutputTokens: 8, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
    { maxAttempts: 2 },
  );

  if (response.status === 403) {
    return { status: "invalid", scopes: { scriptGeneration: false } };
  }

  if (response.status === 400) {
    return { status: "invalid", scopes: { scriptGeneration: false } };
  }

  if (response.status === 429) {
    const body = (await response.json().catch(() => null)) as {
      error?: { details?: Array<{ metadata?: Record<string, string> }> };
    } | null;
    const metadataBlob = JSON.stringify(body?.error?.details ?? []).toLowerCase();
    const isDailyQuota =
      metadataBlob.includes("perday") || metadataBlob.includes("free_tier") || metadataBlob.includes("daily");
    return {
      status: "active",
      amber: isDailyQuota ? "no_credits" : "rate_limited",
      scopes: { scriptGeneration: true },
    };
  }

  if (!response.ok) {
    return { status: "unverified", scopes: { scriptGeneration: false } };
  }

  return { status: "active", scopes: { scriptGeneration: true } };
}
