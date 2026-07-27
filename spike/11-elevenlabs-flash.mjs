// Genera el audio del guion con la voz clonada profesional del creador,
// usando ElevenLabs Flash v2.5 por API directa, y devuelve los tiempos por
// palabra que alimentan los subtítulos karaoke.
//
// Uso:  node spike/11-elevenlabs-flash.mjs

import { loadEnv, api, ELEVEN, elHeaders, log, save, OUT } from './lib.mjs';
import { GUION, BLOQUES, guionPlano } from './guion.mjs';
import { join } from 'node:path';

const VOICE_ID = 'UFyI2KZHifSs85D6voJa'; // "Diegoinnovacion" — clon profesional
const MODEL_ID = 'eleven_flash_v2_5'; // fine-tuned para esta voz
const OUTPUT_FORMAT = 'mp3_44100_128';

// La voz es un clon profesional: similarity alto para respetar el timbre,
// stability media para que no suene plano en un guion enérgico.
const VOICE_SETTINGS = {
  stability: 0.45,
  similarity_boost: 0.85,
  style: 0.0,
};

loadEnv();

const texto = guionPlano();

// El ritmo de habla se mide en caracteres SIN espacios (docs/07-METODOLOGIA-GUION.md
// §6). Contar los espacios infla el total ~21 % y la estimación se va larga.
const CAR_POR_SEGUNDO = 13.2;
const carsSinEspacios = texto.replace(/\s/g, '').length;

log.title('ElevenLabs Flash v2.5 — generación de audio');
log.info(`Voz:    ${VOICE_ID}`);
log.info(`Modelo: ${MODEL_ID}`);
log.info(`Texto:  ${texto.length} car. (${carsSinEspacios} sin espacios)`);
log.info(`Estimado: ~${(carsSinEspacios / CAR_POR_SEGUNDO).toFixed(1)} s a ${CAR_POR_SEGUNDO} car/s`);
log.blank();

log.step('Sintetizando...');
const t0 = Date.now();

const res = await api(
  `${ELEVEN}/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=${OUTPUT_FORMAT}`,
  {
    method: 'POST',
    headers: elHeaders({ 'content-type': 'application/json' }),
    body: JSON.stringify({
      text: texto,
      model_id: MODEL_ID,
      voice_settings: VOICE_SETTINGS,
    }),
  },
  { label: 'text-to-speech/with-timestamps' },
);

const segundos = (Date.now() - t0) / 1000;
log.ok(`Audio generado en ${segundos.toFixed(1)} s`);

// --- audio ---
const audio = Buffer.from(res.audio_base64, 'base64');
const mp3 = save('voz.mp3', audio);
log.ok(`voz.mp3 · ${(audio.length / 1024).toFixed(0)} KB`);

// --- alineación: de caracteres a palabras ---
// ElevenLabs devuelve un tiempo por CARÁCTER. Los subtítulos karaoke necesitan
// palabras, así que agrupamos por espacios.
const al = res.alignment ?? res.normalized_alignment;
if (!al) {
  log.err('La respuesta no trajo alineación. No habrá subtítulos karaoke.');
  process.exit(1);
}

const chars = al.characters;
const ini = al.character_start_times_seconds;
const fin = al.character_end_times_seconds;

const cues = [];
let actual = null;

for (let i = 0; i < chars.length; i++) {
  const c = chars[i];
  if (c.trim() === '') {
    if (actual) {
      cues.push(actual);
      actual = null;
    }
    continue;
  }
  if (!actual) actual = { w: '', t0: ini[i], t1: fin[i] };
  actual.w += c;
  actual.t1 = fin[i];
}
if (actual) cues.push(actual);

const duracion = fin[fin.length - 1];
save('cues.json', cues);
log.ok(`cues.json · ${cues.length} palabras con tiempo`);

// --- límites de bloque, para regenerar uno solo y para los beats ---
// Se localiza cada bloque por posición de carácter dentro del texto plano.
const bloques = [];
let cursor = 0;
for (const b of BLOQUES) {
  const desde = texto.indexOf(b.spoken, cursor);
  if (desde === -1) {
    log.warn(`No se localizó el bloque "${b.id}" en el texto plano`);
    continue;
  }
  const hasta = desde + b.spoken.length - 1;
  cursor = hasta;
  bloques.push({
    id: b.id,
    label: b.label,
    chars: b.spoken.length,
    start: Number(ini[desde].toFixed(3)),
    end: Number(fin[hasta].toFixed(3)),
    duration: Number((fin[hasta] - ini[desde]).toFixed(3)),
  });
}
save('bloques.json', bloques);

// --- informe ---
log.blank();
log.title('Resultado');
log.info(`Duración total: ${duracion.toFixed(2)} s`);
log.info(`Ritmo real:     ${(carsSinEspacios / duracion).toFixed(1)} car/s sin espacios (${(texto.length / duracion).toFixed(1)} con espacios)`);
log.info(`Síntesis:       ${segundos.toFixed(1)} s (${(duracion / segundos).toFixed(1)}× tiempo real)`);
log.blank();

for (const b of bloques) {
  const m = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  log.info(
    `${b.label.padEnd(13)} ${m(b.start)}–${m(b.end)}  ${String(b.duration.toFixed(1)).padStart(5)} s  ${String(b.chars).padStart(3)} car`,
  );
}

save('11-flash-informe.json', {
  generatedAt: new Date().toISOString(),
  voiceId: VOICE_ID,
  modelId: MODEL_ID,
  outputFormat: OUTPUT_FORMAT,
  voiceSettings: VOICE_SETTINGS,
  characters: texto.length,
  charactersNoSpaces: carsSinEspacios,
  durationSeconds: Number(duracion.toFixed(2)),
  charsPerSecond: Number((carsSinEspacios / duracion).toFixed(1)),
  synthesisSeconds: Number(segundos.toFixed(1)),
  wordCount: cues.length,
  blocks: bloques,
});

log.blank();
log.ok(`Audio en ${join(OUT, 'voz.mp3')}`);
