import type { z } from "zod";

// Contrato compartido entre lib/providers/claude.ts y lib/providers/gemini.ts
// — lib/pipeline/llm-provider.ts#resolveGenerator devuelve un `generate` de
// una u otra forma indistintamente, así que ambos proveedores deben aceptar
// exactamente esta misma forma de entrada/salida.

export type StructuredCallInput<T> = {
  apiKey: string;
  model: string;
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

export type GenerateStructuredFn = <T>(input: StructuredCallInput<T>) => Promise<StructuredCallResult<T>>;
