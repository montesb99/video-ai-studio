import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { resolveByokKey } from "@/lib/pipeline/byok";
import { listLooks, uploadAsset, createVideo, getVideoStatus, type HeygenAssetFailureReason } from "@/lib/providers/heygen";

// uploadAsset/createVideo devuelven HeygenAssetFailureReason
// ("invalid_key"|"no_credits"|"in_progress"|"provider_error"), un tipo
// distinto de RenderFailureCode (el que sí tiene traducción en
// avatar.generateErrors). Guardar el reason crudo en render_jobs.error_code
// sin mapear fue un bug real en producción: un "provider_error" quedaba
// grabado tal cual, y cuando el usuario volvía a la pantalla, la UI mostraba
// literalmente "avatar.generateErrors.provider_error" en vez de un mensaje
// en español, porque esa clave nunca existió en las traducciones.
function toRenderFailureCode(reason: HeygenAssetFailureReason): RenderFailureCode {
  if (reason === "invalid_key") return "not_configured";
  if (reason === "no_credits") return "no_credits";
  return "render_failed"; // "in_progress" y "provider_error" caen acá — mensaje genérico, ya traducido
}

export type GenerateAvatarOutcome =
  | { ok: true; renderJobId: string }
  | {
      ok: false;
      reason: "missing_audio" | "look_not_supported" | "not_configured" | "generation_failed" | "already_generating";
    };

/**
 * Núcleo del paso 6 (avatar) — dispara la generación en HeyGen y devuelve de
 * inmediato con un render_jobs en curso; NO espera a que termine (puede
 * tardar 60-209s, medido real en el Spike 0, más que cualquier límite
 * serverless). El cliente sondea con checkAvatarRenderStatus.
 * claim_avatar_generation (028_avatar_generation_claim.sql) evita disparar
 * dos renders del mismo proyecto en paralelo.
 */
export async function runGenerateAvatarStart(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  projectId: string,
  avatarId: string,
  lookId: string,
): Promise<GenerateAvatarOutcome> {
  const { data: claimed } = await supabase.rpc("claim_avatar_generation", { p_project: projectId });
  if (!claimed) return { ok: false, reason: "already_generating" };

  try {
    return await runGenerateAvatarStartClaimed(supabase, workspaceId, projectId, avatarId, lookId);
  } finally {
    await supabase.rpc("release_avatar_generation", { p_project: projectId });
  }
}

async function runGenerateAvatarStartClaimed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  projectId: string,
  avatarId: string,
  lookId: string,
): Promise<GenerateAvatarOutcome> {
  const key = await resolveByokKey(supabase, workspaceId, "heygen");
  if (!key.ok) return { ok: false, reason: "not_configured" };

  const { data: avatar } = await supabase.from("avatars").select("provider_id").eq("id", avatarId).maybeSingle();
  if (!avatar) return { ok: false, reason: "generation_failed" };

  // Re-validado del lado del servidor aunque el selector del cliente ya
  // filtra a looks compatibles — nunca se confía solo en lo que mandó el
  // cliente para una llamada que gasta crédito real de HeyGen. listLooks
  // (a diferencia de uploadAsset/createVideo) lanza en vez de devolver
  // {ok:false} ante un 5xx transitorio de HeyGen — sin este try/catch esa
  // excepción atravesaba generateAvatar y avatar-composer.tsx sin traducir,
  // mostrando un error crudo en vez de avatar.generateErrors.generation_failed.
  let looks: Awaited<ReturnType<typeof listLooks>>;
  try {
    looks = await listLooks(key.apiKey, avatar.provider_id);
  } catch {
    return { ok: false, reason: "generation_failed" };
  }
  const look = looks.find((l) => l.lookId === lookId);
  if (!look || !look.supportsAvatarIII) return { ok: false, reason: "look_not_supported" };

  const { data: scene } = await supabase
    .from("scenes")
    .select("audio_asset_id")
    .eq("project_id", projectId)
    .order("index", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!scene?.audio_asset_id) return { ok: false, reason: "missing_audio" };

  const { data: audioAsset } = await supabase
    .from("assets")
    .select("storage_path, mime")
    .eq("id", scene.audio_asset_id)
    .maybeSingle();
  if (!audioAsset) return { ok: false, reason: "missing_audio" };

  const { data: audioBlob, error: downloadError } = await supabase.storage
    .from("project-media")
    .download(audioAsset.storage_path);
  if (downloadError || !audioBlob) return { ok: false, reason: "generation_failed" };
  const audioBuffer = Buffer.from(await audioBlob.arrayBuffer());

  // docs/03-INTEGRATIONS.md línea 101: "Idempotency-Key (UUID v4 persistido
  // en render_jobs.request_json)" ANTES de la llamada que gasta — no generada
  // al vuelo en cada intento. Si un intento anterior ya insertó una fila
  // 'pending' para este proyecto (crash entre createVideo y el update a
  // 'processing', p. ej. timeout de la función serverless), la reusamos
  // junto con sus mismas claves: uploadAsset/createVideo son idempotentes
  // del lado de HeyGen dentro de 24h, así que repetir la llamada con la
  // MISMA clave no genera un segundo video pagado — solo devuelve la
  // respuesta original. Generar una clave nueva en cada intento (como antes)
  // anulaba por completo el propósito de la idempotencia.
  const { data: existingJob } = await supabase
    .from("render_jobs")
    .select("id, request_json")
    .eq("project_id", projectId)
    .eq("step", "avatar")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let renderJobId: string;
  let uploadIdempotencyKey: string;
  let createIdempotencyKey: string;

  type AvatarRenderRequest = {
    lookId?: string;
    avatarId?: string;
    audioAssetId?: string | null;
    uploadIdempotencyKey?: string;
    createIdempotencyKey?: string;
  };
  const existingReq = existingJob?.request_json as AvatarRenderRequest | null;
  // La fila 'pending' huérfana solo es segura de reusar si es EXACTAMENTE el
  // mismo intento: mismo look, mismo avatar y mismo audio de origen. HeyGen
  // trata la Idempotency-Key como clave de un request completo — si el
  // usuario volvió atrás y cambió de look/avatar, o regeneró la voz (nueva
  // fila en `assets`, nuevo scene.audio_asset_id) antes de reintentar,
  // reusar la misma clave con un body distinto no genera una llamada nueva:
  // HeyGen devuelve la respuesta CACHEADA del intento anterior, en silencio,
  // con el look o el audio viejos. Sin esta comprobación el usuario vería un
  // avatar con la voz o el look que ya había descartado.
  const reusable =
    existingJob &&
    existingReq?.lookId === lookId &&
    existingReq?.avatarId === avatarId &&
    existingReq?.audioAssetId === scene.audio_asset_id;

  if (existingJob && !reusable) {
    // Huérfana pero de un intento distinto — no se reintenta con esa clave,
    // se cierra explícitamente para que no quede pisando la búsqueda de
    // "pending" del próximo intento ni confundiendo un futuro diagnóstico.
    // error_code es siempre un código estable traducible (nunca texto libre
    // del proveedor) — es lo único que checkAvatarRenderStatus/la UI leen;
    // error_message queda reservado para el texto crudo, solo para soporte.
    await supabase
      .from("render_jobs")
      .update({
        status: "failed",
        error_code: "superseded_by_new_selection",
        finished_at: new Date().toISOString(),
      })
      .eq("id", existingJob.id);
  }

  if (reusable && existingJob) {
    renderJobId = existingJob.id;
    uploadIdempotencyKey = existingReq?.uploadIdempotencyKey ?? randomUUID();
    createIdempotencyKey = existingReq?.createIdempotencyKey ?? randomUUID();
  } else {
    uploadIdempotencyKey = randomUUID();
    createIdempotencyKey = randomUUID();
    const { data: inserted, error: insertError } = await supabase
      .from("render_jobs")
      .insert({
        project_id: projectId,
        step: "avatar",
        status: "pending",
        provider: "heygen",
        request_json: {
          lookId,
          avatarId,
          audioAssetId: scene.audio_asset_id,
          uploadIdempotencyKey,
          createIdempotencyKey,
        },
      })
      .select("id")
      .single();
    if (insertError || !inserted) return { ok: false, reason: "generation_failed" };
    renderJobId = inserted.id;
  }

  const uploadResult = await uploadAsset(
    key.apiKey,
    audioBuffer,
    audioAsset.mime === "audio/mpeg" ? "audio/mpeg" : "audio/wav",
    uploadIdempotencyKey,
  );
  if (!uploadResult.ok) {
    await supabase
      .from("render_jobs")
      .update({
        status: "failed",
        error_code: toRenderFailureCode(uploadResult.reason),
        finished_at: new Date().toISOString(),
      })
      .eq("id", renderJobId);
    return { ok: false, reason: uploadResult.reason === "invalid_key" ? "not_configured" : "generation_failed" };
  }

  const videoResult = await createVideo(key.apiKey, {
    lookId,
    audioUrl: uploadResult.url,
    title: `Video AI Studio — ${projectId}`,
    idempotencyKey: createIdempotencyKey,
  });
  if (!videoResult.ok) {
    await supabase
      .from("render_jobs")
      .update({
        status: "failed",
        error_code: toRenderFailureCode(videoResult.reason),
        finished_at: new Date().toISOString(),
      })
      .eq("id", renderJobId);
    return { ok: false, reason: videoResult.reason === "invalid_key" ? "not_configured" : "generation_failed" };
  }

  // A partir de acá el video ya existe y está renderizando del lado de
  // HeyGen (ya cobrado) — la fila 'pending' insertada arriba, ANTES de la
  // llamada, es lo que evita que quede huérfano si el proceso muere en este
  // punto exacto: el registro ya existe, solo falta este último UPDATE.
  const { error: renderJobUpdateError } = await supabase
    .from("render_jobs")
    .update({ status: "processing", external_id: videoResult.videoId, started_at: new Date().toISOString() })
    .eq("id", renderJobId);
  if (renderJobUpdateError) return { ok: false, reason: "generation_failed" };

  await supabase
    .from("projects")
    .update({ avatar_id: avatarId, avatar_look: lookId, status: "avatar", current_step: 5 })
    .eq("id", projectId);

  return { ok: true, renderJobId };
}

// `code` es siempre uno de estos valores fijos, traducible con
// avatar.generateErrors.<code> — nunca el texto crudo del proveedor. Ese
// texto (potencialmente en inglés) se persiste aparte en render_jobs.error_
// message, solo para soporte/depuración, nunca se devuelve al cliente:
// mostrarlo violaría la regla dura "Interfaz 100% en español".
export type RenderFailureCode =
  | "not_found"
  | "missing_asset"
  | "unknown"
  | "not_configured"
  | "render_failed"
  | "download_failed"
  | "upload_failed"
  | "asset_insert_failed"
  | "superseded_by_new_selection"
  | "no_workspace"
  | "no_credits";

export type RenderStatusOutcome =
  | { status: "processing" }
  | { status: "completed"; assetId: string }
  | { status: "failed"; code: RenderFailureCode };

/** Sondeo desde el cliente — si el render_jobs ya es terminal, no vuelve a llamar a HeyGen. */
export async function checkAvatarRenderStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  projectId: string,
  renderJobId: string,
): Promise<RenderStatusOutcome> {
  const { data: job } = await supabase
    .from("render_jobs")
    .select("id, status, external_id, response_json, error_code")
    .eq("id", renderJobId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!job) return { status: "failed", code: "not_found" };

  if (job.status === "completed") {
    const assetId = (job.response_json as { assetId?: string } | null)?.assetId;
    if (assetId) return { status: "completed", assetId };
    return { status: "failed", code: "missing_asset" };
  }
  if (job.status === "failed") return { status: "failed", code: (job.error_code as RenderFailureCode) ?? "unknown" };

  const key = await resolveByokKey(supabase, workspaceId, "heygen");
  if (!key.ok) return { status: "failed", code: "not_configured" };

  // getVideoStatus lanza ante un 5xx/red transitorio de HeyGen (a diferencia
  // de uploadAsset/createVideo) — sin este try/catch, un fallo transitorio
  // A MITAD DEL SONDEO se convertía en una promesa rechazada sin controlar
  // dentro del setInterval de render-progress.tsx, cada 5s, indefinidamente,
  // sin ningún mensaje visible. Se trata como "seguimos esperando" en vez de
  // fallar el job entero por un blip de red — el render sigue en curso del
  // lado de HeyGen aunque esta consulta puntual haya fallado.
  let render: Awaited<ReturnType<typeof getVideoStatus>>;
  try {
    render = await getVideoStatus(key.apiKey, job.external_id as string);
  } catch {
    return { status: "processing" };
  }
  if (render.status === "in_progress") return { status: "processing" };

  if (render.status === "failed") {
    await supabase
      .from("render_jobs")
      .update({ status: "failed", error_code: "render_failed", error_message: render.errorMessage, finished_at: new Date().toISOString() })
      .eq("id", renderJobId);
    return { status: "failed", code: "render_failed" };
  }

  // completed: descargamos el resultado UNA vez y guardamos nuestra propia
  // copia — no dependemos de que la URL de HeyGen siga viva a futuro.
  const videoRes = await fetch(render.videoUrl);
  if (!videoRes.ok) return { status: "failed", code: "download_failed" };
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
  const storagePath = `${workspaceId}/${projectId}/avatar/${renderJobId}.webm`;

  const { error: uploadError } = await supabase.storage
    .from("project-media")
    .upload(storagePath, videoBuffer, { contentType: "video/webm", upsert: true });
  if (uploadError) return { status: "failed", code: "upload_failed" };

  const { data: asset, error: assetError } = await supabase
    .from("assets")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      kind: "avatar_video",
      source: "generated",
      storage_path: storagePath,
      mime: "video/webm",
      bytes: videoBuffer.byteLength,
      gen_model: "avatar_iii",
    })
    .select("id")
    .single();
  if (assetError || !asset) return { status: "failed", code: "asset_insert_failed" };

  await supabase
    .from("render_jobs")
    .update({ status: "completed", response_json: { assetId: asset.id }, finished_at: new Date().toISOString() })
    .eq("id", renderJobId);

  return { status: "completed", assetId: asset.id };
}
