// Paso 2 — Listar tus voces de ElevenLabs y encontrar la clonada profesional.

import { loadEnv, api, elHeaders, ELEVEN, log, save, fail } from './lib.mjs';

loadEnv();
log.title('Paso 2 · Tus voces de ElevenLabs');

log.step('Consultando tu catálogo...');

const payload = await api(`${ELEVEN}/v1/voices`, { headers: elHeaders() }, { label: 'GET /v1/voices' });
const voices = payload?.voices ?? [];

if (voices.length === 0) {
  save('02-elevenlabs-raw.json', payload);
  fail('No encontramos voces en tu cuenta', 'Revisa spike/out/02-elevenlabs-raw.json y pásame lo que veas.');
}

log.ok(`${voices.length} voces encontradas`);

// ElevenLabs marca la categoría: professional / cloned / premade / generated
const norm = voices.map((v) => ({
  id: v.voice_id,
  name: v.name,
  category: v.category ?? 'desconocida',
  labels: v.labels ?? {},
  preview: v.preview_url ?? null,
}));

const professional = norm.filter((v) => v.category === 'professional');
const cloned = norm.filter((v) => v.category === 'cloned');
const others = norm.filter((v) => !['professional', 'cloned'].includes(v.category));

function show(title, arr) {
  if (!arr.length) return;
  log.title(title);
  arr.forEach((v) => {
    log.ok(`${v.name}  —  ${v.id}`);
    const tags = Object.values(v.labels).filter(Boolean).join(' · ');
    if (tags) log.info(tags);
  });
}

show('Voces clonadas profesionalmente', professional);
show('Otras voces clonadas', cloned);
show(`Biblioteca (${others.length})`, others.slice(0, 5));
if (others.length > 5) log.info(`… y ${others.length - 5} más`);

// --- recomendación -----------------------------------------------------------
const best = professional[0] ?? cloned[0] ?? null;

log.title('Recomendación');
if (best) {
  log.ok(`Usa esta voz para la prueba:  ${best.name}  (${best.category})`);
  console.log(`\n    ELEVENLABS_VOICE_ID=${best.id}\n`);
  log.info('Pégalo en spike/.env y continúa con el paso 3.');
} else {
  log.warn('No encontramos voces clonadas tuyas, solo de la biblioteca.');
  log.info('La prueba funciona igual, pero no medirá la calidad de TU voz.');
  log.info('Si tienes una voz clonada en otra cuenta, usa la clave de esa cuenta.');
  if (norm[0]) console.log(`\n    ELEVENLABS_VOICE_ID=${norm[0].id}\n`);
}

save('02-elevenlabs-voices.json', {
  total: norm.length,
  professional,
  cloned,
  recommended: best,
});

log.blank();
log.ok('Guardado en spike/out/02-elevenlabs-voices.json');
