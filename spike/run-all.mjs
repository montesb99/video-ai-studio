// Corre los 5 pasos en orden. Para al primer fallo.

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { DIR, log } from './lib.mjs';

const pasos = [
  ['01-heygen-audit.mjs',      'Auditar HeyGen'],
  ['02-elevenlabs-voices.mjs', 'Listar voces'],
  ['03-elevenlabs-audio.mjs',  'Generar audio'],
  ['04-heygen-video.mjs',      'Generar avatar'],
  ['05-report.mjs',            'Reporte'],
];

for (const [archivo, nombre] of pasos) {
  const r = spawnSync(process.execPath, [join(DIR, archivo)], { stdio: 'inherit' });
  if (r.status !== 0) {
    log.blank();
    log.err(`Se detuvo en: ${nombre}`);
    log.info('Corrige lo que indica arriba y vuelve a lanzar run-all.');
    log.info('Los pasos ya completados no se repiten de forma destructiva.');
    process.exit(r.status ?? 1);
  }
}

log.blank();
log.ok('Los 5 pasos terminaron. Abre spike/out/REPORTE.md');
