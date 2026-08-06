import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { resolveByokKey } from "@/lib/pipeline/byok";
import { materializeScenes, type SceneRow } from "@/lib/pipeline/scenes";
import { synthesizeWithTimestamps, type WordCue } from "@/lib/providers/elevenlabs";
import { silencePcm, concatenatePcm, wrapPcmAsWav } from "@/lib/pipeline/audio-concat";
import { DEFAULT_VOICE_SETTINGS, type StoredVoiceSettings } from "@/lib/pipeline/voice-presets";
import type { ScriptBlocksOutput } from "@/lib/pipeline/schemas";

const SAMPLE_RATE = 24000;
const PAUSE_MS_BETWEEN_SCENES = 350;

export type GenerateVoiceOutcome =
  | { ok: true; assetId: string }
  | {
      ok: false;
      reason:
        | "missing_script"
        | "missing_voice"
        | "not_configured"
        | "generation_failed"
        | "already_generating";
    };

/**
 * Núcleo del paso 4 (voz) — sintetiza el guion confirmado bloque por bloque
 * con la voz elegida, concatena todo en un único WAV, y deja cada `scenes`
 * con su propio recorte de tiempos por palabra. claim_voice_generation
 * (027_voice_generation_claim.sql) evita que dos pestañas disparen dos
 * síntesis completas del mismo proyecto en simultáneo — mismo patrón que
 * claim_script_generation del Sprint 3.
 */
export async function runGenerateVoice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  projectId: string,
): Promise<GenerateVoiceOutcome> {
  const { data: claimed } = await supabase.rpc("claim_voice_generation", { p_project: projectId });
  if (!claimed) return { ok: false, reason: "already_generating" };

  try {
    return await runGenerateVoiceClaimed(supabase, workspaceId, projectId);
  } finally {
    await supabase.rpc("release_voice_generation", { p_project: projectId });
  }
}

async function runGenerateVoiceClaimed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  projectId: string,
): Promise<GenerateVoiceOutcome> {
  const { data: project } = await supabase
    .from("projects")
    .select("voice_id, voice_settings_json")
    .eq("id", projectId)
    .single();
  if (!project) return { ok: false, reason: "generation_failed" };
  if (!project.voice_id) return { ok: false, reason: "missing_voice" };

  const { data: voice } = await supabase.from("voices").select("provider_id").eq("id", project.voice_id).maybeSingle();
  const voiceProviderId = voice?.provider_id;
  if (!voiceProviderId) return { ok: false, reason: "missing_voice" };

  const { data: script } = await supabase
    .from("scripts")
    .select("id, blocks_json")
    .eq("project_id", projectId)
    .eq("is_confirmed", true)
    .maybeSingle();
  if (!script) return { ok: false, reason: "missing_script" };

  const key = await resolveByokKey(supabase, workspaceId, "elevenlabs");
  if (!key.ok) return { ok: false, reason: "not_configured" };

  const settings: StoredVoiceSettings = (project.voice_settings_json as StoredVoiceSettings | null) ?? DEFAULT_VOICE_SETTINGS;

  const scenes = await materializeScenes(
    supabase,
    projectId,
    script.id,
    script.blocks_json as ScriptBlocksOutput,
  );

  const pcmChunks: Buffer[] = [];
  const perScene: Array<{ scene: SceneRow; words: WordCue[]; startAt: number; durationSeconds: number }> = [];
  let cursorSeconds = 0;

  for (const scene of scenes) {
    // Antes esto salteaba la escena en silencio: su audio_asset_id quedaba
    // null para siempre, approve_voice la rechaza sin fin, y el guion
    // confirmado no se puede editar — un callejón sin salida real sin
    // ningún mensaje al usuario. El esquema ahora exige spoken no-vacío
    // tras trim() (lib/pipeline/schemas.ts), así que esto ya no debería
    // ocurrir con guiones nuevos — se trata igual como fallo explícito del
    // lote, nunca como "no hay nada que sintetizar acá".
    if (!scene.text.trim()) return { ok: false, reason: "generation_failed" };

    const result = await synthesizeWithTimestamps(key.apiKey, voiceProviderId, scene.text, {
      stability: settings.stability,
      similarity_boost: settings.similarity_boost,
      style: settings.style,
      speed: settings.speed,
    });
    // Un bloque fallido aborta el lote completo — nunca se manda a HeyGen un
    // audio con un hueco a mitad de guion. El usuario reintenta desde cero
    // (mismo claim, no gasta doble: el lote anterior nunca llegó a guardarse).
    if (!result.ok) return { ok: false, reason: result.reason === "invalid_key" ? "not_configured" : "generation_failed" };

    perScene.push({ scene, words: result.data.words, startAt: cursorSeconds, durationSeconds: result.data.durationSeconds });
    pcmChunks.push(result.data.pcm);
    cursorSeconds += result.data.durationSeconds + PAUSE_MS_BETWEEN_SCENES / 1000;
    pcmChunks.push(silencePcm(PAUSE_MS_BETWEEN_SCENES, SAMPLE_RATE));
  }

  if (perScene.length === 0) return { ok: false, reason: "generation_failed" };

  const wav = wrapPcmAsWav(concatenatePcm(pcmChunks), SAMPLE_RATE);
  // Ruta única por generación (no "audio/voz.wav" fijo): cada regeneración
  // creaba una fila nueva en `assets` pero pisaba el mismo archivo físico de
  // la generación anterior, dejando filas viejas con storage_path/bytes/
  // duration_ms que ya no correspondían al contenido real — y abría una
  // ventana de carrera con generate-avatar.ts, que puede estar descargando
  // ese mismo storage_path (de una fila `assets` distinta, ya vieja) justo
  // cuando una regeneración de voz lo sobrescribe a mitad de lectura: los
  // claims de voz y de avatar (027/028) son locks independientes, no se
  // excluyen entre sí. Con un id de generación en la ruta, cada WAV queda
  // inmutable y ligado 1:1 a su fila de `assets`.
  const generationId = randomUUID();
  const storagePath = `${workspaceId}/${projectId}/audio/${generationId}.wav`;

  const { error: uploadError } = await supabase.storage
    .from("project-media")
    .upload(storagePath, wav, { contentType: "audio/wav", upsert: false });
  if (uploadError) return { ok: false, reason: "generation_failed" };

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      kind: "audio",
      source: "generated",
      storage_path: storagePath,
      mime: "audio/wav",
      bytes: wav.byteLength,
      duration_ms: Math.round(cursorSeconds * 1000),
      gen_model: "eleven_multilingual_v2",
    })
    .select("id")
    .single();
  if (assetError || !asset) return { ok: false, reason: "generation_failed" };

  for (const entry of perScene) {
    // caption_cues_json queda relativo al inicio de CADA escena, no al audio
    // completo — si el día de mañana se regenera un solo bloque, alcanza con
    // recalcular start_at de las escenas siguientes, sin reescribir cues.
    await supabase
      .from("scenes")
      .update({
        audio_asset_id: asset.id,
        caption_cues_json: entry.words,
        duration_est: entry.durationSeconds,
        start_at: entry.startAt,
      })
      .eq("id", entry.scene.id);
  }

  return { ok: true, assetId: asset.id };
}
