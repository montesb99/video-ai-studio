// Utilidades compartidas del spike.
// Las claves se leen de spike/.env y NUNCA se imprimen.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DIR = dirname(fileURLToPath(import.meta.url));
export const OUT = join(DIR, 'out');

export function loadEnv() {
  const path = join(DIR, '.env');
  if (!existsSync(path)) {
    fail(
      'No existe spike/.env',
      'Ejecuta:  cp spike/.env.example spike/.env\ny rellena tus claves dentro de ese archivo.'
    );
  }
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && m[2]) process.env[m[1]] = m[2].trim();
  }
}

export function need(key, hint) {
  const v = process.env[key];
  if (!v) fail(`Falta ${key} en spike/.env`, hint);
  return v;
}

/** Enmascara cualquier secreto que se cuele en un texto antes de imprimirlo. */
export function redact(text) {
  const s = typeof text === 'string' ? text : JSON.stringify(text, null, 2);
  return s.replace(/\b[A-Za-z0-9_\-]{24,}\b/g, (m) => m.slice(0, 4) + '…' + m.slice(-4));
}

export function ensureOut() {
  mkdirSync(OUT, { recursive: true });
}

export function save(name, data) {
  ensureOut();
  const path = join(OUT, name);
  writeFileSync(path, typeof data === 'string' || Buffer.isBuffer(data)
    ? data
    : JSON.stringify(data, null, 2));
  return path;
}

export function readOut(name) {
  const path = join(OUT, name);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

// --- salida por consola ---
const C = { r: '\x1b[0m', b: '\x1b[1m', dim: '\x1b[2m', g: '\x1b[32m', y: '\x1b[33m', red: '\x1b[31m', cy: '\x1b[36m' };

export const log = {
  title: (t) => console.log(`\n${C.b}${C.cy}▸ ${t}${C.r}\n`),
  ok:    (t) => console.log(`  ${C.g}✓${C.r} ${t}`),
  warn:  (t) => console.log(`  ${C.y}!${C.r} ${t}`),
  err:   (t) => console.log(`  ${C.red}✗${C.r} ${t}`),
  info:  (t) => console.log(`    ${C.dim}${t}${C.r}`),
  step:  (t) => console.log(`  ${C.dim}…${C.r} ${t}`),
  blank: () => console.log(''),
};

export function fail(what, hint) {
  log.blank();
  log.err(what);
  if (hint) console.log(`\n${hint}\n`);
  process.exit(1);
}

/** fetch con reintentos y errores legibles. Nunca imprime cabeceras. */
export async function api(url, opts = {}, { retries = 3, label = 'petición', soft = false } = {}) {
  const stop = (what, hint) => {
    if (soft) throw new Error(`${what}${hint ? ' — ' + hint : ''}`);
    fail(what, hint);
  };
  for (let attempt = 1; attempt <= retries; attempt++) {
    let res;
    try {
      res = await fetch(url, opts);
    } catch (e) {
      if (attempt === retries) stop(`${label}: sin conexión`, redact(e.message));
      await sleep(1500 * attempt);
      continue;
    }

    if (res.ok) {
      const ct = res.headers.get('content-type') || '';
      return ct.includes('json') ? res.json() : Buffer.from(await res.arrayBuffer());
    }

    const body = await res.text().catch(() => '');

    if (res.status === 401 || res.status === 403) {
      stop(
        `${label}: clave rechazada (${res.status})`,
        'Revisa la clave en spike/.env. Cópiala completa, sin espacios ni saltos de línea.'
      );
    }
    if (res.status === 400 || res.status === 404 || res.status === 422) {
      stop(`${label}: petición inválida (${res.status})`, redact(body).slice(0, 900));
    }
    // 402 sin créditos y 409 idempotencia en vuelo NUNCA son transitorios.
    if (res.status === 402) {
      stop(
        `${label}: sin créditos en la cuenta del proveedor (402)`,
        'Recarga créditos y vuelve a lanzar este paso. La petición era válida.'
      );
    }
    if (res.status === 409) {
      stop(`${label}: petición idéntica ya en curso (409)`, 'Espera a que termine la anterior.');
    }
    if (attempt === retries) {
      stop(`${label}: falló tras ${retries} intentos (${res.status})`, redact(body).slice(0, 900));
    }

    const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * attempt;
    log.warn(`${label}: ${res.status}, reintento ${attempt}/${retries - 1} en ${Math.round(wait / 1000)} s`);
    await sleep(wait);
  }
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const HEYGEN = 'https://api.heygen.com';
export const ELEVEN = 'https://api.elevenlabs.io';

export const hgHeaders = () => ({
  'x-api-key': need('HEYGEN_API_KEY', 'Sácala del panel de HeyGen → Settings → API.'),
  'content-type': 'application/json',
});

export const elHeaders = (extra = {}) => ({
  'xi-api-key': need('ELEVENLABS_API_KEY', 'Sácala del panel de ElevenLabs → Profile → API Keys.'),
  ...extra,
});

/**
 * Guion — Propuesta 3, "El contraste de mercado".
 *
 * ⚠ REGLA CENTRAL: `spoken` es SOLO lo que dice el avatar.
 * Nada de etiquetas de bloque, tiempos, títulos ni fuentes entre paréntesis:
 * eso se leería en voz alta. Las fuentes van en `onScreen`, como texto
 * superpuesto por el motion graphics.
 *
 * Además `spoken` ya viene NORMALIZADO PARA TTS: cifras y siglas escritas
 * como se pronuncian ("veinticuatro por ciento", no "24 %"; "innovación",
 * no "INNOVACION"), porque el sintetizador lee caracteres, no intención.
 */
export const GUION = {
  hook: {
    spoken:
      'Si tienes un negocio en Perú y crees que la inteligencia artificial ' +
      'es cosa de empresas grandes, esto te va a doler.',
    onScreen: { titulo: '🏢 Las grandes ya tienen COMITÉ de IA ⚡', fuente: null },
  },
  promise: {
    spoken:
      'Te explico qué están haciendo ellas que tú puedes copiar mañana, ' +
      'gratis. Toma nota al final.',
    onScreen: { titulo: null, fuente: null },
  },
  content: [
    {
      spoken:
        'Mientras el veinticuatro por ciento de las grandes ya le asignó la ' +
        'supervisión de la inteligencia artificial a un comité, la mayoría de ' +
        'pymes ni siquiera sabe quién la usa dentro de su equipo.',
      onScreen: { dato: '24%', etiqueta: 'de las grandes ya tiene comité de IA', fuente: 'EY Perú · AI & Boards 2026' },
    },
    {
      spoken:
        'Y las mipymes somos casi el cien por ciento de las empresas formales ' +
        'del país.',
      onScreen: { dato: '99,5%', etiqueta: 'de las empresas formales son mipymes', fuente: 'PRODUCE · Estadística MIPYME' },
    },
    {
      spoken:
        'La ventaja de ser chico es que no necesitas un comité: necesitas ' +
        'media hora. Junta a tu equipo, pregunta quién usa inteligencia ' +
        'artificial y para qué, y anótalo.',
      onScreen: { dato: null, etiqueta: 'Media hora. Eso es todo.', fuente: null },
    },
  ],
  cta: {
    spoken:
      '¿Sabes quién usa inteligencia artificial dentro de tu negocio? ' +
      'Comenta innovación y te mando el acceso a mi comunidad.',
    onScreen: { palabraClave: 'INNOVACION', fuente: null },
  },
};

/** SOLO la voz en off. Es lo único que se le manda al sintetizador. */
export const guionPlano = () =>
  [
    GUION.hook.spoken,
    GUION.promise.spoken,
    ...GUION.content.map((c) => c.spoken),
    GUION.cta.spoken,
  ].join(' ');
