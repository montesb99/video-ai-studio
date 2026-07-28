import "server-only";
import { fetchWithRetry } from "./http";
import type { z } from "zod";

// docs/03-INTEGRATIONS.md — Claude es "nuestra" clave (no BYOK), model
// sonnet-5 para todo lo interactivo (ideación/guion/ediciones), opus-5
// reservado a análisis estructural que se llama una sola vez (docs/07 §8).

const BASE_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export const CLAUDE_SONNET = "claude-sonnet-5" as const;
export const CLAUDE_OPUS = "claude-opus-5" as const;
type ClaudeModel = typeof CLAUDE_SONNET | typeof CLAUDE_OPUS;

export type StructuredCallInput<T> = {
  model: ClaudeModel;
  /** Ya compuesto: metodología + nicho + tarea + reglas anti-injection (lib/pipeline/prompts.ts#composeSystemPrompt). */
  system: string;
  /** Incluye <fuentes><fuente id=".." tipo=".."> delimitadas (lib/pipeline/context.ts#buildSourceContext). */
  userContent: string;
  toolName: string;
  toolDescription: string;
  schemaJson: Record<string, unknown>;
  schema: z.ZodType<T>;
  maxTokens?: number;
  /** Default 2: 1 intento + 1 con el error de esquema reforzado — llamada interactiva, el usuario espera en la UI. */
  maxAttempts?: number;
};

export type StructuredCallResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "invalid_json" | "http_error" | "blocked" | "rate_limited" | "not_configured" };

type ClaudeMessage = { role: "user" | "assistant"; content: string };

async function callOnce(
  apiKey: string,
  model: ClaudeModel,
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, reason: "not_configured" };

  const maxAttempts = input.maxAttempts ?? 2;
  const messages: ClaudeMessage[] = [{ role: "user", content: input.userContent }];

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await callOnce(
      apiKey,
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
