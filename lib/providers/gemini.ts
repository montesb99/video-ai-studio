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
//   - Auth: header x-goog-api-key (confirmado con una clave invalida real:
//     devuelve 400 con body {"error":{"code":400,"status":"INVALID_ARGUMENT",
//     "details":[{"reason":"API_KEY_INVALID"}]}} -- NO 401. Hay que mapear
//     400+API_KEY_INVALID a "invalid", no un 401 que esta API no usa para esto).
//   - Salida estructurada: generationConfig.responseMimeType = "application/json"
//     + generationConfig.responseSchema -- subconjunto de OpenAPI 3.0 (NO el
//     JSON Schema que usa el resto del pipeline): "type" en mayusculas
//     ("OBJECT"/"STRING"/"ARRAY"/...) y sin soporte de $ref/$defs -- de ahi
//     toGeminiSchema() mas abajo.
//   - ⚠ additionalProperties NO es aceptado por el modelo realmente disponible
//     hoy (probado en vivo: 400 INVALID_ARGUMENT "Unknown name
//     additionalProperties"), pese a que la documentacion de nov-2025 decia
//     que la API lo soportaba -- el soporte real depende del modelo, cambio
//     entre cuando se investigo esto por primera vez y ahora. Un objeto libre
//     (p.ej. onScreen: z.record(...) en lib/pipeline/schemas.ts) sin
//     `properties` NI `additionalProperties` siempre vuelve como `{}` vacio
//     -- Gemini no tiene forma de saber que claves llenar. Por eso
//     toGeminiSchema() convierte cualquier objeto libre a un campo STRING que
//     debe contener JSON codificado, y restoreFreeformObjects() lo decodifica
//     de vuelta despues de parsear la respuesta, antes de la validacion zod.
//   - ⚠ thinkingConfig.thinkingBudget NO es aceptado por el modelo realmente
//     disponible hoy (probado en vivo: 400 INVALID_ARGUMENT) -- ese parametro
//     es especifico de la familia gemini-2.5, no de gemini-3.x. Como distintas
//     familias de modelo usan nombres de campo distintos (o ninguno) para
//     apagar el "thinking", en vez de intentar seguirle el ritmo a esto se
//     deja el thinking activado y se compensa con maxOutputTokens generoso
//     (ver DEFAULT_MAX_TOKENS) -- confirmado en vivo que con margen suficiente
//     el modelo igual entrega el JSON real despues de pensar.
//   - Reintentos: mismo criterio que el resto de proveedores via fetchWithRetry.

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// "gemini-flash-latest": alias oficial de Google al modelo flash vigente,
// NO un modelo fijo. Se eligio a proposito en vez de una version fechada
// (p.ej. "gemini-2.5-flash"): probado en vivo el 4-ago-2026, "gemini-2.5-flash"
// -- pese a figurar todavia en /v1beta/models -- devuelve 404 "This model is
// no longer available to new users" para una clave de Google AI Studio recien
// creada, y "gemini-2.0-flash" devuelve 429 con cuota gratuita en 0 (quedo
// deprecado). El alias "-latest" es la unica opcion que respondio 200 con una
// clave nueva real. Riesgo aceptado: el modelo detras del alias puede cambiar
// sin aviso (hoy resuelve a "gemini-3.6-flash", visible en
// response.modelVersion) -- se prefiere eso a que la integracion quede rota
// para cualquier usuario que conecte una clave nueva, que es exactamente lo
// que le paso al usuario de este proyecto con "gemini-2.5-flash" el mismo dia
// que se escribio este archivo.
export const GEMINI_FLASH = "gemini-flash-latest" as const;

// Sin control sobre thinkingConfig (ver nota de arriba), el presupuesto de
// tokens de salida tiene que cubrir tanto el "pensamiento" interno del modelo
// como el JSON real. Probado en vivo: un ping trivial con 20 tokens ya
// consume ~16-27 en pensamiento antes de poder emitir texto. 4096 (el default
// que ya usaba claude.ts) deja margen de sobra para guiones completos.
const DEFAULT_MAX_TOKENS = 4096;

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

function resolveRef(node: JsonSchemaNode, defs: Record<string, JsonSchemaNode>): JsonSchemaNode {
  if (typeof node.$ref !== "string") return node;
  const refName = node.$ref.replace(/^#\/\$defs\//, "");
  const target = defs[refName];
  if (!target) throw new Error(`toGeminiSchema: no se pudo resolver ${node.$ref} contra $defs`);
  return resolveRef(target, defs);
}

/**
 * Convierte JSON Schema estandar (el que ya usa lib/pipeline/schemas.ts, con
 * $ref/$defs y "type" en minusculas) al subconjunto de OpenAPI que exige
 * responseSchema de Gemini. Resuelve cada $ref: "#/$defs/x" inline contra
 * los $defs del propio esquema raiz -- Gemini no entiende referencias, asi
 * que el caller nunca tiene que mantener dos copias del esquema a mano.
 *
 * Un objeto libre (`{type:"object"}` sin `properties`, p.ej. blockSchema.onScreen)
 * se convierte a `{type:"STRING"}`, no a `{type:"OBJECT", additionalProperties:true}`
 * -- ver la nota de cabecera del archivo sobre por que additionalProperties no
 * es una opcion viable hoy. `restoreFreeformObjects()` decodifica ese string de
 * vuelta a objeto real despues de recibir la respuesta.
 */
export function toGeminiSchema(schemaJson: JsonSchemaNode): Record<string, unknown> {
  const defs = (schemaJson.$defs as Record<string, JsonSchemaNode> | undefined) ?? {};

  function convert(node: unknown): unknown {
    if (Array.isArray(node)) return node.map(convert);
    if (node === null || typeof node !== "object") return node;

    const obj = resolveRef(node as JsonSchemaNode, defs);
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
      // Objeto libre (docs/07-METODOLOGIA-GUION.md §3-bis: onScreen por
      // bloque) -- ver comentario de cabecera del archivo. Se pide como JSON
      // codificado en un string; restoreFreeformObjects() lo decodifica.
      out.type = "STRING";
      out.description = [obj.description, "JSON valido codificado como string (objeto con pares clave-valor libres)."]
        .filter(Boolean)
        .join(" ");
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
    if (out.description === undefined && typeof obj.description === "string") out.description = obj.description;

    return out;
  }

  return convert(schemaJson) as Record<string, unknown>;
}

/**
 * Contraparte de toGeminiSchema(): recorre `data` guiado por el JSON Schema
 * ORIGINAL (no el convertido) y, en cada punto donde el schema original tenia
 * un objeto libre sin `properties` (que toGeminiSchema forzo a STRING),
 * decodifica el JSON si `data` llego como string. Si el modelo no llego a
 * emitir JSON valido en ese campo, se deja el string tal cual -- la
 * validacion zod que sigue es la que decide si eso es aceptable o no.
 */
export function restoreFreeformObjects(schemaJson: JsonSchemaNode, data: unknown): unknown {
  const defs = (schemaJson.$defs as Record<string, JsonSchemaNode> | undefined) ?? {};

  function walk(node: unknown, value: unknown): unknown {
    if (node === null || typeof node !== "object") return value;
    const obj = resolveRef(node as JsonSchemaNode, defs);

    if (obj.type === "object" && obj.properties && typeof obj.properties === "object" && value && typeof value === "object" && !Array.isArray(value)) {
      const out: Record<string, unknown> = { ...(value as Record<string, unknown>) };
      for (const [key, childSchema] of Object.entries(obj.properties as Record<string, unknown>)) {
        if (key in out) out[key] = walk(childSchema, out[key]);
      }
      return out;
    }

    if (obj.type === "object" && !obj.properties) {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    }

    if (obj.type === "array" && obj.items !== undefined && Array.isArray(value)) {
      return value.map((item) => walk(obj.items, item));
    }

    return value;
  }

  return walk(schemaJson, data);
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
      input.maxTokens ?? DEFAULT_MAX_TOKENS,
    );

    if (!result.ok) {
      if (result.reason === "rate_limited" || result.reason === "blocked") return result;
      if (attempt === maxAttempts - 1) return result;
      continue;
    }

    const restored = restoreFreeformObjects(input.schemaJson, result.input);
    const parsed = input.schema.safeParse(restored);
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
 * Llamada real minima (maxOutputTokens con margen, sin responseSchema) para
 * validar la clave. Estados confirmados contra la API real (no asumidos de
 * memoria, probado el 4-ago-2026 con una clave invalida real):
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
        generationConfig: { maxOutputTokens: 64 },
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
