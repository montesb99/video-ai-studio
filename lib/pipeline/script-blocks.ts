import "server-only";
import { scriptBlocksSchema, type ScriptBlocksOutput, type Block } from "./schemas";
import { normalizeSpokenText } from "./normalize-spoken";

/**
 * Única función permitida para construir el valor que se inserta/actualiza
 * en scripts.blocks_json — ninguna Server Action lo escribe a mano. Revalida
 * con zod (defensa en profundidad, aunque el tool-forcing de Claude ya
 * debería garantizarlo) y aplica normalize-spoken.ts como red de seguridad
 * final antes de persistir.
 */
export function buildBlocksJson(claudeOutput: unknown): ScriptBlocksOutput {
  const parsed = scriptBlocksSchema.safeParse(claudeOutput);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`buildBlocksJson: salida no cumple el esquema (${issues})`);
  }

  const normalizeBlock = (block: Block): Block => ({
    spoken: normalizeSpokenText(block.spoken),
    onScreen: block.onScreen,
  });

  return {
    ...parsed.data,
    hook: normalizeBlock(parsed.data.hook),
    promise: normalizeBlock(parsed.data.promise),
    content: parsed.data.content.map(normalizeBlock),
    cta: normalizeBlock(parsed.data.cta),
  };
}

export type BlockPath = "hook" | "promise" | "cta" | `content:${number}`;

export function getBlockByPath(blocks: ScriptBlocksOutput, path: string): Block | null {
  if (path === "hook") return blocks.hook;
  if (path === "promise") return blocks.promise;
  if (path === "cta") return blocks.cta;
  const match = /^content:(\d+)$/.exec(path);
  if (match) return blocks.content[Number(match[1])] ?? null;
  return null;
}

export function setBlockByPath(blocks: ScriptBlocksOutput, path: string, block: Block): ScriptBlocksOutput {
  if (path === "hook") return { ...blocks, hook: block };
  if (path === "promise") return { ...blocks, promise: block };
  if (path === "cta") return { ...blocks, cta: block };
  const match = /^content:(\d+)$/.exec(path);
  if (match) {
    const index = Number(match[1]);
    const content = blocks.content.slice();
    content[index] = block;
    return { ...blocks, content };
  }
  return blocks;
}

/**
 * Única función permitida para leer el texto que va a ElevenLabs (Sprint 4)
 * — lee exclusivamente `.spoken`. docs/02-DATA-MODEL.md: "blocks_json separa
 * spoken de onScreen. No es opcional" — el bug real del Spike 0 fue el
 * avatar leyendo etiquetas de bloque y citas de fuente en voz alta porque
 * algo concatenó onScreen junto con spoken.
 */
export function concatenateSpokenText(blocksJson: ScriptBlocksOutput): string {
  return [
    blocksJson.hook.spoken,
    blocksJson.promise.spoken,
    ...blocksJson.content.map((block) => block.spoken),
    blocksJson.cta.spoken,
  ].join(" ");
}
