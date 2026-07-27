// Paso 1 — Auditar la cuenta de HeyGen.
// Endpoint correcto: GET /v3/avatars/looks  (los looks traen supported_api_engines)

import { loadEnv, api, hgHeaders, HEYGEN, log, save, fail } from './lib.mjs';

loadEnv();
log.title('Paso 1 · Auditoría de tu cuenta de HeyGen');

// --- traer todos los looks propios, paginando --------------------------------
async function traerLooks(ownership) {
  const acc = [];
  let token = null;
  for (let page = 0; page < 20; page++) {
    const qs = new URLSearchParams({ limit: '50', ownership });
    if (token) qs.set('token', token);
    const res = await api(
      `${HEYGEN}/v3/avatars/looks?${qs}`,
      { headers: hgHeaders() },
      { label: `GET /v3/avatars/looks (${ownership})`, retries: 2, soft: true }
    );
    const items = res?.data ?? [];
    acc.push(...items);
    if (!res?.has_more || !res?.next_token) break;
    token = res.next_token;
  }
  return acc;
}

log.step('Consultando tus looks...');

let looks = [];
try {
  looks = await traerLooks('private');
  log.ok(`Conectado con HeyGen`);
} catch (e) {
  fail('No pudimos listar tus looks', String(e.message));
}

if (looks.length === 0) {
  log.warn('No hay looks privados. Probando el catálogo público...');
  try { looks = await traerLooks('public'); } catch { /* nada */ }
}

if (looks.length === 0) {
  fail(
    'No encontramos ningún look en la cuenta',
    'Crea un avatar en el panel de HeyGen y vuelve a correr este paso.'
  );
}

log.ok(`${looks.length} looks encontrados`);

// --- clasificar ---------------------------------------------------------------
const norm = looks.map((l) => ({
  id: l.id,
  name: l.name,
  tipo: l.avatar_type,
  engines: l.supported_api_engines ?? [],
  orientacion: l.preferred_orientation,
  estado: l.status,
  grupo: l.group_id,
  voz: l.default_voice_id,
}));

const conIII = norm.filter((l) => l.engines.includes('avatar_iii'));
const listos = conIII.filter((l) => !l.estado || l.estado === 'completed');
const vertical = listos.filter((l) => l.orientacion === 'portrait');

// --- informe -------------------------------------------------------------------
log.title('Compatibilidad con Avatar III');

if (conIII.length) {
  log.ok(`${conIII.length} de ${norm.length} looks soportan avatar_iii`);
  log.blank();
  conIII.slice(0, 12).forEach((l) => {
    const marcas = [
      l.tipo,
      l.orientacion ?? 'orientación ?',
      l.estado && l.estado !== 'completed' ? `⚠ ${l.estado}` : null,
    ].filter(Boolean).join(' · ');
    log.ok(`${l.name}`);
    log.info(`${l.id}   ${marcas}`);
  });
  if (conIII.length > 12) log.info(`… y ${conIII.length - 12} más (en el JSON)`);
} else {
  log.err('Ningún look soporta avatar_iii.');
  log.blank();
  log.info('Motores que sí soportan tus looks:');
  const cuenta = {};
  norm.forEach((l) => l.engines.forEach((e) => (cuenta[e] = (cuenta[e] ?? 0) + 1)));
  Object.entries(cuenta).forEach(([e, n]) => log.info(`  ${e}: ${n} looks`));
  log.blank();
  log.info('Avatar III cubre Digital Twin (video) y Photo Avatar.');
  log.info('Si tus avatares son de otro tipo, hay que crear uno compatible,');
  log.info('o cambiar la decisión de producto y usar el motor que sí tienes.');
}

// --- orientación ----------------------------------------------------------------
log.title('Orientación (buscamos vertical para 9:16)');
if (vertical.length) {
  log.ok(`${vertical.length} looks en portrait`);
} else if (listos.length) {
  log.warn('Ningún look declara portrait.');
  log.info('Se puede pedir aspect_ratio 9:16 igual, pero el encuadre puede recortar mal.');
}

// --- matting -----------------------------------------------------------------
log.title('Fondo transparente (matting)');
log.warn('La API NO expone si el avatar tiene matting.');
log.info('Solo se comprueba generando: el paso 4 pide output_format webm.');
log.info('Si el .webm sale con fondo negro sólido en vez de transparente,');
log.info('no hay matting — y eso cambia el diseño de la pantalla de Escenas.');

// --- recomendación ---------------------------------------------------------------
const mejor = vertical[0] ?? listos[0] ?? conIII[0] ?? norm[0];

log.title('Recomendación');
if (conIII.length && mejor) {
  log.ok(`Usa este look:  ${mejor.name}`);
  log.info(`${mejor.tipo} · ${mejor.orientacion ?? 'orientación ?'}`);
  console.log(`\n    HEYGEN_LOOK_ID=${mejor.id}\n`);
  log.info('Pégalo en spike/.env y continúa con el paso 2.');
} else if (mejor) {
  log.warn('Ningún look soporta avatar_iii. Para probar la cadena igualmente,');
  log.warn('el paso 4 puede correr sin el campo engine (motor por defecto).');
  console.log(`\n    HEYGEN_LOOK_ID=${mejor.id}\n`);
}

save('01-heygen-audit.json', {
  totalLooks: norm.length,
  soportanAvatarIII: conIII.length,
  listos: listos.length,
  vertical: vertical.length,
  recomendado: mejor ? { id: mejor.id, name: mejor.name, tipo: mejor.tipo, orientacion: mejor.orientacion } : null,
  mattingExpuestoPorLaApi: false,
  looks: norm,
});

log.blank();
log.ok('Guardado en spike/out/01-heygen-audit.json');
