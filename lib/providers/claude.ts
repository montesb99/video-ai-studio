import "server-only";
import { fetchWithRetry } from "./http";
import type { StructuredCallInput, StructuredCallResult } from "./llm-types";

// docs/03-INTEGRATIONS.md — Claude es el proveedor de referencia para
// ideación/guion: modelo sonnet-5 para todo lo interactivo (ideación/guion/
// ediciones), opus-5 reservado a análisis estructural que se llama una sola
// vez (docs/07 §8). Desde Sprint 3 Parte E es BYOK-primero (el workspace
// puede conectar su propia clave en /integrations) con la ANTHROPIC_API_KEY
// de plataforma como respaldo si no conecta ninguna — ver
// lib/pipeline/llm-provider.ts#resolveGenerator, que decide qué apiKey pasar.

const BASE_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export const CLAUDE_SONNET = "claude-sonnet-5" as const;
export const CLAUDE_OPUS = "claude-opus-5" as const;

type ClaudeMessage = { role: "user" | "assistant"; content: string };

async function callOnce(
  apiKey: string,
  model: string,
  system: string,
  messages: ClaudeMessage[],
  toolName: string,
  toolDescription: string,
  schemaJson: Record<string, unknown>,
  maxTokens: number,
): Promise<
  | { ok: true; input: unknown }
  | { ok: false; reason: "invalid_json" | "http_error" | "blocked" | "rate_limited" }
> {
  const response = await fetchWithRetry(
    BASE_URL,
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages,
        tools: [{ name: toolName, description: toolDescription, input_schema: schemaJson }],
        tool_choice: { type: "tool", name: toolName },
      }),
    },
    { maxAttempts: 2 },
  );

  if (response.status === 429) return { ok: false, reason: "rate_limited" };
  if (!response.ok) return { ok: false, reason: "http_error" };

  const body = (await response.json().catch(() => null)) as {
    stop_reason?: string;
    content?: Array<{ type: string; name?: string; input?: unknown }>;
  } | null;

  if (body?.stop_reason === "refusal") return { ok: false, reason: "blocked" };

  const toolUse = body?.content?.find((block) => block.type === "tool_use" && block.name === toolName);
  if (!toolUse) return { ok: false, reason: "invalid_json" };

  return { ok: true, input: toolUse.input };
}

/**
 * Fuerza la salida a JSON válido contra `schemaJson` vía tool-forcing
 * (`tool_choice`) — nunca se parsea prosa/markdown de la respuesta. Si el
 * primer intento no valida contra `schema`, reintenta mostrándole al modelo
 * su propio intento y el motivo del rechazo. Nunca loguea `userContent` ni
 * la respuesta cruda — solo el resultado final (ok/reason).
 */
export async function generateStructured<T>(
  input: StructuredCallInput<T>,
): Promise<StructuredCallResult<T>> {
  if (!input.apiKey) return { ok: false, reason: "not_configured" };

  const maxAttempts = input.maxAttempts ?? 2;
  const messages: ClaudeMessage[] = [{ role: "user", content: input.userContent }];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await callOnce(
      input.apiKey,
      input.model,
      input.system,
      messages,
      input.toolName,
      input.toolDescription,
      input.schemaJson,
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
    messages.push(
      { role: "assistant", content: JSON.stringify(result.input) },
      {
        role: "user",
        content: `Tu respuesta anterior no cumplió el esquema (${issues}). Corregila y volvé a emitir la herramienta ${input.toolName} completa.`,
      },
    );
  }

  return { ok: false, reason: "invalid_json" };
}

export type ClaudeVerifyResult = {
  status: "active" | "invalid" | "unverified";
  amber?: "no_credits" | "rate_limited";
  scopes: { scriptGeneration: boolean };
};

/**
 * Llamada real mínima (max_tokens bajo, sin tools) para validar la clave.
 * Estados confirmados contra la API real (no asumidos de memoria): 401 clave
 * inválida; 400 invalid_request_error con "credit balance" en el mensaje es
 * el caso real que Anthropic devuelve para saldo agotado (no reserva un 402
 * dedicado, a diferencia de lo documentado para otros proveedores); 429
 * límite de tasa.
 */
export async function verifyKey(apiKey: string): Promise<ClaudeVerifyResult> {
  const response = await fetchWithRetry(
    BASE_URL,
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_SONNET,
        max_tokens: 8,
        messages: [{ role: "user", content: "ping" }],
      }),
    },
    { maxAttempts: 2 },
  );

  if (response.status === 401 || response.status === 403) {
    return { status: "invalid", scopes: { scriptGeneration: false } };
  }
  if (response.status === 429) {
    return { status: "active", amber: "rate_limited", scopes: { scriptGeneration: true } };
  }
  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    if (body?.error?.message?.toLowerCase().includes("credit balance")) {
      return { status: "active", amber: "no_credits", scopes: { scriptGeneration: true } };
    }
    return { status: "invalid", scopes: { scriptGeneration: false } };
  }
  if (!response.ok) {
    return { status: "unverified", scopes: { scriptGeneration: false } };
  }
  return { status: "active", scopes: { scriptGeneration: true } };
}
