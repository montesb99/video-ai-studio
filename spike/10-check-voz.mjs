// Verifica que la clave de ElevenLabs tenga permisos y que la voz del creador
// exista, ANTES de gastar caracteres generando audio.
//
// Uso:  node spike/10-check-voz.mjs

import { loadEnv, api, ELEVEN, elHeaders, log, save, redact } from './lib.mjs';

const VOICE_ID = 'UFyI2KZHifSs85D6voJa';
const MODEL_ID = 'eleven_flash_v2_5';

loadEnv();

log.title('ElevenLabs — verificación de clave, voz y modelo');

// 1 · La clave responde y sabemos qué plan es
const user = await api(`${ELEVEN}/v1/user/subscription`, { headers: elHeaders() }, {
  label: 'user/subscription',
  soft: true,
}).catch((e) => {
  log.err('La clave no puede leer la suscripción');
  log.info(redact(e.message));
  return null;
});

if (user) {
  const usados = user.character_count ?? 0;
  const limite = user.character_limit ?? 0;
  log.ok(`Clave válida · plan ${user.tier ?? '?'}`);
  log.info(`Caracteres: ${usados.toLocaleString('es-PE')} / ${limite.toLocaleString('es-PE')}`);
  log.info(`Disponibles: ${(limite - usados).toLocaleString('es-PE')}`);
}

// 2 · La voz del creador existe y es suya
const voz = await api(`${ELEVEN}/v1/voices/${VOICE_ID}`, { headers: elHeaders() }, {
  label: `voices/${VOICE_ID}`,
  soft: true,
}).catch((e) => {
  log.err(`No se pudo leer la voz ${VOICE_ID}`);
  log.info(redact(e.message));
  return null;
});

if (voz) {
  log.ok(`Voz encontrada: "${voz.name}"`);
  log.info(`Categoría: ${voz.category ?? '?'}`);
  if (voz.labels && Object.keys(voz.labels).length) {
    log.info(`Etiquetas: ${JSON.stringify(voz.labels)}`);
  }
  const finetuning = voz.fine_tuning?.state ?? voz.fine_tuning?.finetuning_state;
  if (finetuning) log.info(`Fine-tuning: ${JSON.stringify(finetuning)}`);
}

// 3 · El modelo Flash 2.5 está disponible para esta cuenta y soporta español
const modelos = await api(`${ELEVEN}/v1/models`, { headers: elHeaders() }, {
  label: 'models',
  soft: true,
}).catch((e) => {
  log.err('No se pudo listar los modelos');
  log.info(redact(e.message));
  return null;
});

let flash = null;
if (modelos) {
  flash = modelos.find((m) => m.model_id === MODEL_ID);
  if (flash) {
    log.ok(`Modelo disponible: ${flash.name} (${flash.model_id})`);
    const es = (flash.languages ?? []).find((l) => l.language_id === 'es');
    log.info(es ? `Soporta español: ${es.name}` : 'ADVERTENCIA: no declara español');
    log.info(`Máx. caracteres por petición: ${flash.max_characters_request_free_user ?? '?'} (free) / ${flash.max_characters_request_subscribed_user ?? '?'} (pago)`);
    if (flash.can_use_speaker_boost != null) log.info(`speaker_boost: ${flash.can_use_speaker_boost}`);
  } else {
    log.err(`El modelo ${MODEL_ID} NO aparece en los modelos de esta cuenta`);
    log.info('Modelos visibles: ' + modelos.map((m) => m.model_id).join(', '));
  }
}

save('10-check-voz.json', {
  checkedAt: new Date().toISOString(),
  voiceId: VOICE_ID,
  modelId: MODEL_ID,
  keyOk: Boolean(user),
  voiceOk: Boolean(voz),
  voiceName: voz?.name ?? null,
  voiceCategory: voz?.category ?? null,
  modelOk: Boolean(flash),
  charactersRemaining: user ? (user.character_limit ?? 0) - (user.character_count ?? 0) : null,
});

log.blank();
if (user && voz && flash) {
  log.ok('Todo listo para generar el audio.');
} else {
  log.err('Hay algo que arreglar antes de generar audio (ver arriba).');
}
