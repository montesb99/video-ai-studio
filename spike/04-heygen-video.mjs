// Paso 4 — Generar el avatar con lip-sync sobre NUESTRO audio.
// Valida de una sola vez: audio externo + Avatar III + fondo transparente.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  loadEnv, api, hgHeaders, HEYGEN, log, save, need, fail, sleep, OUT, redact,
} from './lib.mjs';

loadEnv();
log.title('Paso 4 · Generar el avatar con lip-sync');

const lookId = need(
  'HEYGEN_LOOK_ID',
  'Corre primero:  node spike/01-heygen-audit.mjs\ny pega el look_id que te recomiende.'
);

const mp3Path = join(OUT, 'voz.mp3');
if (!existsSync(mp3Path)) {
  fail('Falta spike/out/voz.mp3', 'Corre primero:  node spike/03-elevenlabs-audio.mjs');
}

// --- 1. subir el audio -------------------------------------------------------
const mp3 = readFileSync(mp3Path);
log.step(`Subiendo el audio (${(mp3.length / 1024).toFixed(0)} KB, límite 32 MB)...`);

let audioAssetId = null;
let audioUrl = null;

try {
  // POST /v3/assets — multipart/form-data, máx 32 MB, acepta mp3 y wav
  const form = new FormData();
  form.append('file', new Blob([mp3], { type: 'audio/mpeg' }), 'voz.mp3');

  const up = await api(
    `${HEYGEN}/v3/assets`,
    {
      method: 'POST',
      headers: {
        'x-api-key': process.env.HEYGEN_API_KEY,
        'Idempotency-Key': randomUUID(),
        // no fijamos content-type: fetch pone el boundary del multipart
      },
      body: form,
    },
    { label: 'POST /v3/assets', retries: 2 }
  );

  const d = up?.data ?? up;
  audioAssetId = d?.asset_id ?? d?.id ?? null;
  audioUrl = d?.url ?? null;

  if (audioAssetId) log.ok(`Audio subido  —  asset ${audioAssetId}`);
  else if (audioUrl) log.ok('Audio subido (por URL)');
  else {
    save('04-upload-raw.json', up);
    fail('La subida respondió sin asset_id ni url', 'Revisa spike/out/04-upload-raw.json y pásame lo que veas.');
  }
} catch (e) {
  fail(
    'No pudimos subir el audio a HeyGen',
    'Si el endpoint de assets cambió, pásame el error y lo ajusto.\n' + redact(String(e?.message ?? e))
  );
}

// --- 2. crear el video -------------------------------------------------------
const body = {
  type: 'avatar',
  avatar_id: lookId,
  ...(audioAssetId ? { audio_asset_id: audioAssetId } : { audio_url: audioUrl }),
  engine: { type: 'avatar_iii' },
  resolution: '1080p',
  aspect_ratio: '9:16',
  output_format: 'webm',   // implica fondo transparente; NO enviar background
  title: 'Spike 0 — Video AI Studio',
};

log.blank();
log.step('Creando el video...');
log.info('engine: avatar_iii · 9:16 · 1080p · webm (transparente)');
log.info('fuente de voz: nuestro audio de ElevenLabs');

const idem = randomUUID();
let created;

try {
  created = await api(
    `${HEYGEN}/v3/videos`,
    {
      method: 'POST',
      headers: { ...hgHeaders(), 'Idempotency-Key': idem },
      body: JSON.stringify(body),
    },
    { label: 'POST /v3/videos', retries: 2 }
  );
} catch (e) {
  const msg = String(e?.message ?? e);
  log.blank();
  log.err('Falló la creación del video.');
  if (/engine|avatar_iii/i.test(msg)) {
    log.info('Parece que este look NO soporta avatar_iii.');
    log.info('Prueba con otro look del paso 1, o quita el campo engine para usar el motor por defecto.');
  }
  if (/matting|background|webm/i.test(msg)) {
    log.info('Parece que este avatar NO está entrenado con matting.');
    log.info('IMPORTANTE: sin alpha cambia el diseño de la pantalla de Escenas. Avísame.');
  }
  save('04-error.json', { body, error: redact(msg) });
  process.exit(1);
}

const videoId = (created?.data ?? created)?.video_id;
if (!videoId) {
  save('04-create-raw.json', created);
  fail('La respuesta no trajo video_id', 'Revisa spike/out/04-create-raw.json.');
}

log.ok(`Video en cola  —  ${videoId}`);
save('04-request.json', { body, videoId, idempotencyKey: idem });

// --- 3. esperar --------------------------------------------------------------
log.blank();
log.step('Esperando el render (60-180 s típico)...');

const t0 = Date.now();
let final = null;

for (let i = 0; i < 60; i++) {
  await sleep(10_000);
  const st = await api(
    `${HEYGEN}/v3/videos/${encodeURIComponent(videoId)}`,
    { headers: hgHeaders() },
    { label: 'GET /v3/videos/{id}', retries: 2 }
  );
  const d = st?.data ?? st;
  const estado = d?.status;
  const seg = Math.round((Date.now() - t0) / 1000);

  if (estado === 'completed' || estado === 'success') { final = d; break; }
  if (estado === 'failed' || estado === 'error') {
    save('04-failed.json', d);
    fail(`El render falló tras ${seg} s`, redact(JSON.stringify(d, null, 2)).slice(0, 900));
  }
  log.info(`${seg}s — ${estado ?? 'procesando'}`);
}

if (!final) fail('Se agotó la espera (10 min)', `Consulta más tarde el video ${videoId}.`);

const total = Math.round((Date.now() - t0) / 1000);
log.ok(`Render completado en ${total} s`);

// --- 4. descargar ------------------------------------------------------------
const url = final.video_url ?? final.url ?? final.output_url;
if (!url) {
  save('04-final.json', final);
  fail('No vino la URL del video', 'Revisa spike/out/04-final.json.');
}

log.step('Descargando...');
const bin = await api(url, {}, { label: 'descarga', retries: 2 });
save('avatar.webm', bin);
log.ok(`avatar.webm  —  ${(bin.length / 1024 / 1024).toFixed(1)} MB`);

save('04-heygen-result.json', {
  videoId, engine: 'avatar_iii', aspectRatio: '9:16',
  resolution: '1080p', outputFormat: 'webm',
  segundosDeRender: total, resultado: final,
});

// --- resumen -----------------------------------------------------------------
log.title('Confirmado');
log.ok('HeyGen aceptó nuestro audio externo y sincronizó los labios');
log.ok('Avatar III funcionó con este look');
log.ok('Salida en webm 9:16 a 1080p');

log.title('Ahora revísalo tú');
log.info('1. Abre spike/out/avatar.webm');
log.info('2. ¿Los labios van sincronizados con el audio?');
log.info('3. ¿El fondo es TRANSPARENTE (cuadros) o NEGRO SÓLIDO?');
log.info('   Si es negro sólido, el avatar no tiene matting → me avisas,');
log.info('   porque eso cambia el diseño de la pantalla de Escenas.');
log.info('4. Mira tus créditos en HeyGen antes y después: ¿cuánto consumió?');
