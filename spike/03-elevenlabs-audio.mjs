// Paso 3 — Generar el audio del guion CON tiempos por palabra.
// Esta es la pieza clave: los timestamps alimentan los subtítulos karaoke
// y el alineado de los beats de 8 s, sin ningún paso de transcripción.

import { loadEnv, api, elHeaders, ELEVEN, log, save, need, guionPlano, GUION } from './lib.mjs';

loadEnv();
log.title('Paso 3 · Generar el audio con tiempos por palabra');

const voiceId = need(
  'ELEVENLABS_VOICE_ID',
  'Corre primero:  node spike/02-elevenlabs-voices.mjs\ny pega el voice_id que te recomiende.'
);
const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

const texto = guionPlano();
const palabras = texto.split(/\s+/).length;

log.ok(`Guion de prueba: ${palabras} palabras`);
log.info(`Duración esperada: ~${(palabras / 2.6).toFixed(1)} s a 2,6 pal/s`);
log.info(`Modelo: ${modelId}`);
log.blank();
log.step('Sintetizando... (puede tardar 20-60 s)');

const t0 = Date.now();

const res = await api(
  `${ELEVEN}/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`,
  {
    method: 'POST',
    headers: elHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({
      text: texto,
      model_id: modelId,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
    }),
  },
  { label: 'POST text-to-speech/with-timestamps' }
);

const segundos = ((Date.now() - t0) / 1000).toFixed(1);
log.ok(`Audio generado en ${segundos} s`);

// --- audio -------------------------------------------------------------------
if (!res.audio_base64) {
  save('03-elevenlabs-raw.json', res);
  log.err('La respuesta no trajo audio_base64. Revisa spike/out/03-elevenlabs-raw.json');
  process.exit(1);
}

const mp3 = Buffer.from(res.audio_base64, 'base64');
save('voz.mp3', mp3);
log.ok(`voz.mp3  —  ${(mp3.length / 1024).toFixed(0)} KB`);

// --- caracteres → palabras ---------------------------------------------------
const al = res.alignment ?? res.normalized_alignment ?? null;

if (!al?.characters) {
  log.warn('No vinieron los timestamps. El karaoke necesitaría transcripción.');
  save('03-elevenlabs-raw.json', res);
} else {
  const chars = al.characters;
  const starts = al.character_start_times_seconds ?? [];
  const ends = al.character_end_times_seconds ?? [];

  const cues = [];
  let actual = '';
  let inicio = null;

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (/\s/.test(c)) {
      if (actual) {
        cues.push({ w: actual, t0: +inicio.toFixed(3), t1: +ends[i - 1].toFixed(3) });
        actual = '';
        inicio = null;
      }
    } else {
      if (inicio === null) inicio = starts[i];
      actual += c;
    }
  }
  if (actual && inicio !== null) {
    cues.push({ w: actual, t0: +inicio.toFixed(3), t1: +ends[chars.length - 1].toFixed(3) });
  }

  const duracion = cues.length ? cues[cues.length - 1].t1 : 0;
  save('cues.json', cues);

  log.ok(`cues.json  —  ${cues.length} palabras con tiempos`);
  log.blank();
  log.info('Primeras palabras:');
  cues.slice(0, 6).forEach((c) => log.info(`  ${c.t0.toFixed(2)}s → ${c.t1.toFixed(2)}s   "${c.w}"`));

  // --- comprobaciones de producto -------------------------------------------
  log.title('Comprobaciones');
  log.ok(`Duración real: ${duracion.toFixed(1)} s`);

  if (duracion > 55) log.warn(`Se pasa de 50 s. El guion real tendrá que ser más corto.`);
  else if (duracion < 40) log.warn(`Queda corto. El guion real puede llevar más contenido.`);
  else log.ok('Dentro del objetivo de 50 s');

  log.ok(`Ritmo real: ${(cues.length / duracion).toFixed(2)} pal/s  (estimábamos 2,6)`);

  // Beats de 8 s alineados a límite de palabra
  const beats = [];
  for (let t = 8; t < duracion; t += 8) {
    const siguiente = cues.find((c) => c.t0 >= t);
    beats.push({ ideal: t, real: siguiente ? siguiente.t0 : t, palabra: siguiente?.w ?? null });
  }
  save('beats.json', beats);
  log.ok(`${beats.length} beats de 8 s, desplazados a límite de palabra`);
  beats.forEach((b) =>
    log.info(`  ${b.ideal}s → ${b.real.toFixed(2)}s  (antes de "${b.palabra}")`)
  );

  save('03-elevenlabs-summary.json', {
    voiceId, modelId, palabras: cues.length,
    duracionSegundos: +duracion.toFixed(2),
    ritmoPalabrasPorSegundo: +(cues.length / duracion).toFixed(2),
    segundosDeGeneracion: +segundos,
    beats,
  });
}

log.blank();
log.title('Escúchalo antes de seguir');
log.info('Abre spike/out/voz.mp3');
log.info('Es exactamente lo que dirá tu avatar. Si no te convence, no sigas al paso 4.');
log.blank();
log.info('Solo se sintetizó la VOZ EN OFF. Nunca las etiquetas ni las fuentes:');
log.info(`  HOOK  "${GUION.hook.spoken.slice(0, 70)}..."`);
log.info(`  CTA   "${GUION.cta.spoken.slice(0, 70)}..."`);
log.blank();
log.info('Estos datos van SUPERPUESTOS en pantalla, no hablados:');
GUION.content.filter((c) => c.onScreen?.dato).forEach((c) =>
  log.info(`  ${c.onScreen.dato}  ${c.onScreen.etiqueta}  —  ${c.onScreen.fuente}`)
);
