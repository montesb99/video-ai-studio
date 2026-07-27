// Diagnóstico: ver la forma real de la respuesta de /v3/avatars,
// sin imprimir nada sensible.

import { loadEnv, api, hgHeaders, HEYGEN, log, save } from './lib.mjs';

loadEnv();
log.title('Diagnóstico · forma de /v3/avatars');

const payload = await api(`${HEYGEN}/v3/avatars`, { headers: hgHeaders() }, { label: 'GET /v3/avatars' });
save('00-avatars-raw.json', payload);

const raw = payload?.data ?? payload;
log.ok(`Claves del nivel superior: ${Object.keys(raw ?? {}).join(', ') || '(array)'}`);

const list = raw?.avatars ?? raw?.looks ?? raw?.items ?? (Array.isArray(raw) ? raw : []);
log.ok(`Elementos: ${list.length}`);

if (list[0]) {
  log.blank();
  log.info('Campos del primer elemento:');
  for (const [k, v] of Object.entries(list[0])) {
    const t = Array.isArray(v) ? `array[${v.length}]` : typeof v;
    const muestra = Array.isArray(v)
      ? JSON.stringify(v).slice(0, 120)
      : String(v ?? '').slice(0, 80);
    log.info(`  ${k.padEnd(26)} ${t.padEnd(12)} ${muestra}`);
  }
}

// ¿Hay un endpoint de looks por avatar?
const primerId = list[0]?.avatar_id ?? list[0]?.id;
if (primerId) {
  log.blank();
  log.title('Probando rutas de looks');
  const rutas = [
    `/v3/avatars/${primerId}/looks`,
    `/v3/avatars/looks?avatar_id=${primerId}`,
    `/v3/avatar_looks?avatar_id=${primerId}`,
  ];
  for (const r of rutas) {
    try {
      const res = await fetch(`${HEYGEN}${r}`, { headers: hgHeaders() });
      if (res.ok) {
        const j = await res.json();
        const d = j?.data ?? j;
        const arr = d?.looks ?? d?.items ?? (Array.isArray(d) ? d : []);
        log.ok(`${r}  →  200, ${arr.length} looks`);
        save('00-looks-raw.json', j);
        if (arr[0]) {
          log.info(`  campos: ${Object.keys(arr[0]).join(', ')}`);
        }
        break;
      } else {
        log.warn(`${r}  →  ${res.status}`);
      }
    } catch (e) {
      log.warn(`${r}  →  sin conexión`);
    }
  }
}

log.blank();
log.ok('Guardado en spike/out/00-avatars-raw.json');
