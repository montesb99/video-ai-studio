import { z } from "zod";

// docs/07-METODOLOGIA-GUION.md §3-bis: cada bloque es {spoken, onScreen} —
// nunca un string plano. Esta es la defensa de esquema contra el bug real
// del Spike 0 (el avatar leía en voz alta etiquetas y citas de fuente).
export const blockSchema = z.object({
  // .trim() antes de .min(1): un `spoken` de puro espacio/tab pasaba
  // min(1) sin problema (la longitud del string sin recortar sí era >=1),
  // y ElevenLabs no tiene forma de sintetizar "nada" — generate-voice.ts
  // saltaba esa escena en silencio, dejándola sin audio_asset_id para
  // siempre y bloqueando approve_voice sin ningún mensaje al usuario
  // (bug real, Sprint 4). Acá se corta en el momento de generar el guion,
  // con contexto para que el LLM reintente, en vez de descubrirse recién
  // al sintetizar la voz.
  spoken: z.string().trim().min(1),
  onScreen: z.record(z.string(), z.unknown()),
});
export type Block = z.infer<typeof blockSchema>;

export const scriptBlocksSchema = z.object({
  hook: blockSchema,
  promise: blockSchema,
  content: z.array(blockSchema).min(1).max(5),
  cta: blockSchema,
  palabraClave: z.string().min(1),
  fuentesUsadas: z.array(z.number().int()).default([]),
  avisos: z.array(z.string()).default([]),
});
export type ScriptBlocksOutput = z.infer<typeof scriptBlocksSchema>;

export const SCRIPT_BLOCKS_JSON_SCHEMA = {
  type: "object",
  properties: {
    hook: { $ref: "#/$defs/block" },
    promise: { $ref: "#/$defs/block" },
    content: { type: "array", items: { $ref: "#/$defs/block" }, minItems: 1, maxItems: 5 },
    cta: { $ref: "#/$defs/block" },
    palabraClave: { type: "string" },
    fuentesUsadas: { type: "array", items: { type: "integer" } },
    avisos: { type: "array", items: { type: "string" } },
  },
  required: ["hook", "promise", "content", "cta", "palabraClave", "fuentesUsadas", "avisos"],
  $defs: {
    block: {
      type: "object",
      properties: {
        spoken: { type: "string" },
        onScreen: { type: "object" },
      },
      required: ["spoken", "onScreen"],
    },
  },
} as const;

export const proposalSchema = z.object({
  enfoque: z.string().min(1),
  gancho: z.string().min(1).max(90),
  descripcion: z.string().min(1),
  porQueFunciona: z.string().min(1),
  viralidad: z.object({
    puntaje: z.number().int().min(0).max(100),
    razon: z.string().min(1),
  }),
  cta: z.object({
    objetivo: z.enum(["leads", "followers"]),
    texto: z.string().min(1),
    palabraClave: z.string().min(1),
  }),
  duracionEstimada: z.number().int().positive(),
});
export type Proposal = z.infer<typeof proposalSchema>;

export const proposalsSchema = z.object({
  propuestas: z.array(proposalSchema).length(3),
  nichoDetectado: z.string().nullable().optional(),
  avisos: z.array(z.string()).default([]),
});
export type ProposalsOutput = z.infer<typeof proposalsSchema>;

export const PROPOSALS_JSON_SCHEMA = {
  type: "object",
  properties: {
    propuestas: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          enfoque: { type: "string" },
          gancho: { type: "string", maxLength: 90 },
          descripcion: { type: "string" },
          porQueFunciona: { type: "string" },
          viralidad: {
            type: "object",
            properties: {
              puntaje: { type: "integer", minimum: 0, maximum: 100 },
              razon: { type: "string" },
            },
            required: ["puntaje", "razon"],
          },
          cta: {
            type: "object",
            properties: {
              objetivo: { type: "string", enum: ["leads", "followers"] },
              texto: { type: "string" },
              palabraClave: { type: "string" },
            },
            required: ["objetivo", "texto", "palabraClave"],
          },
          duracionEstimada: { type: "integer" },
        },
        required: ["enfoque", "gancho", "descripcion", "porQueFunciona", "viralidad", "cta", "duracionEstimada"],
      },
    },
    nichoDetectado: { type: ["string", "null"] },
    avisos: { type: "array", items: { type: "string" } },
  },
  required: ["propuestas", "avisos"],
} as const;

export const editAssistSchema = blockSchema;
export type EditAssistOutput = Block;

export const EDIT_ASSIST_JSON_SCHEMA = SCRIPT_BLOCKS_JSON_SCHEMA.$defs.block;
