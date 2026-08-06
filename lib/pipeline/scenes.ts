import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getBlockByPath, type BlockPath } from "./script-blocks";
import type { ScriptBlocksOutput } from "./schemas";

export type SceneRow = {
  id: string;
  index: number;
  block: "hook" | "promise" | "content" | "cta";
  path: BlockPath;
  text: string;
  audioAssetId: string | null;
};

function blockPaths(blocks: ScriptBlocksOutput): BlockPath[] {
  return ["hook", "promise", ...blocks.content.map((_, i) => `content:${i}` as BlockPath), "cta"];
}

function pathToBlockType(path: BlockPath): "hook" | "promise" | "content" | "cta" {
  return path.startsWith("content:") ? "content" : (path as "hook" | "promise" | "cta");
}

/**
 * Convierte scripts.blocks_json en filas de scenes — nunca se hizo hasta
 * este sprint (la tabla existe desde 007_scripts_and_scenes.sql pero ningún
 * código la poblaba). Idempotente vía `on conflict do nothing`: se puede
 * llamar en cada intento de generación de voz sin duplicar filas ni pisar
 * texto ya usado como base de un audio ya sintetizado. Mismo orden que
 * concatenateSpokenText (lib/pipeline/script-blocks.ts), para que el índice
 * de cada escena coincida con el orden en que se escucha el guion.
 */
export async function materializeScenes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  scriptId: string,
  blocks: ScriptBlocksOutput,
): Promise<SceneRow[]> {
  const paths = blockPaths(blocks);
  const rows = paths.map((path, index) => ({
    project_id: projectId,
    script_id: scriptId,
    index,
    block: pathToBlockType(path),
    text: getBlockByPath(blocks, path)?.spoken ?? "",
  }));

  // upsert + ignoreDuplicates en vez de insert: un intento anterior ya pudo
  // haber materializado estas mismas filas (mismo project_id+index) — con
  // insert plano, Postgres rechaza el lote ENTERO por el unique_violation de
  // una sola fila. ignoreDuplicates deja pasar las nuevas y descarta en
  // silencio las que ya existían, sin pisar su audio_asset_id.
  const { error: insertError } = await supabase
    .from("scenes")
    .upsert(rows, { onConflict: "project_id,index", ignoreDuplicates: true });
  if (insertError) throw new Error(`materializeScenes: no se pudieron insertar las escenas (${insertError.message})`);

  const { data: existing, error: selectError } = await supabase
    .from("scenes")
    .select("id, index, block, audio_asset_id")
    .eq("project_id", projectId)
    .order("index", { ascending: true });
  if (selectError || !existing) throw new Error("materializeScenes: no se pudieron leer las escenas.");

  return existing.map((row) => ({
    id: row.id,
    index: row.index,
    block: row.block,
    path: paths[row.index],
    text: getBlockByPath(blocks, paths[row.index])?.spoken ?? "",
    audioAssetId: row.audio_asset_id,
  }));
}
