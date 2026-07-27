/**
 * Compilador de composición — versión mínima de lo que hará
 * lib/render/compile-variables.ts en el producto.
 *
 * Entrada:  cues.json (tiempos por palabra de ElevenLabs) + CARDS (abajo)
 * Salida:   public/index.html (composición HyperFrames lista para render)
 *
 * Estilo: editorial collage naranja/blanco. Transiciones cada 5 s.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const CUES = JSON.parse(readFileSync(join(DIR, 'cues.json'), 'utf8'));

const ID = 'motion-naranja';
const W = 1080, H = 1920, FPS = 30, DUR = 47.52;
const q = (t) => Math.round(t * FPS) / FPS;           // cuantizar al frame
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ─────────────────────────── Las 10 escenas ───────────────────────────
   modo 'motion'  → fondo de color, tipografía grande, avatar reducido u oculto
   modo 'avatar'  → fondo natural oscuro, avatar a pantalla completa, texto abajo
   Cambio cada 5 s.                                                        */
const CARDS = [
  { id: 'c01', t: [0.0, 5.0],   modo: 'motion', bg: 'naranja',
    kicker: 'PYMES · PERÚ 2026', serifBack: 'grandes', serif: '¿Solo para', serifAcc: 'GRANDES?' },

  { id: 'c02', t: [5.0, 10.0],  modo: 'avatar',
    lower: 'Esto te va a', lowerAcc: 'doler' },

  { id: 'c03', t: [10.0, 15.0], modo: 'avatar',
    badge: 'TOMA NOTA AL FINAL',
    lower: 'Copia mañana lo que', lowerAcc: 'ya hacen ellas' },

  { id: 'c04', t: [15.0, 20.0], modo: 'motion', bg: 'naranja', dato: '24%',
    datoLabel: 'de las grandes ya tiene', datoLabel2: 'comité de IA',
    fuente: 'EY PERÚ · AI & BOARDS 2026' },

  { id: 'c05', t: [20.0, 25.0], modo: 'avatar',
    lower: 'Y la mayoría de pymes', lowerAcc: 'ni sabe quién la usa' },

  { id: 'c06', t: [25.0, 30.0], modo: 'motion', bg: 'blanco', dato: '99,5%',
    datoLabel: 'de las empresas formales', datoLabel2: 'del país son mipymes',
    fuente: 'PRODUCE · ESTADÍSTICA MIPYME' },

  { id: 'c07', t: [30.0, 35.0], modo: 'motion', bg: 'naranja',
    serifBack: 'hora', serif: 'No un comité.', serifAcc: 'MEDIA HORA' },

  { id: 'c08', t: [35.0, 40.0], modo: 'avatar',
    pasos: ['Junta a tu equipo', 'Pregunta quién usa IA', 'Anótalo'] },

  { id: 'c09', t: [40.0, 45.0], modo: 'avatar',
    lower: '¿Sabes quién usa IA', lowerAcc: 'dentro de tu negocio?' },

  { id: 'c10', t: [45.0, 47.52], modo: 'motion', bg: 'naranja',
    kicker: 'COMENTA LA PALABRA', clave: 'INNOVACION' },
];

/* Encuadre del avatar por escena, en TRANSFORMACIONES (scale/y), no en left/top:
   las propiedades de layout se ajustan a píxeles enteros y tiemblan al capturar
   frame a frame. Con transform la interpolación es sub-píxel. */
const ENCUADRE = {
  c01: { s: 1.00, y: 700, op: 0.16 }, // apenas insinuado
  c02: { s: 1.00, y: 0,   op: 1 },
  c03: { s: 1.00, y: 0,   op: 1 },
  c04: { s: 0.56, y: 360, op: 1 },    // cede la mitad superior al dato
  c05: { s: 1.00, y: 0,   op: 1 },
  c06: { s: 0.56, y: 360, op: 1 },
  c07: { s: 1.00, y: 760, op: 0.14 },
  c08: { s: 0.74, y: -330, op: 1 },  // sube para no tapar los pasos
  c09: { s: 1.00, y: 0,   op: 1 },
  c10: { s: 0.52, y: 480, op: 1 },
};

/* ───────────────────────── Subtítulos karaoke ─────────────────────────
   Agrupa las palabras en líneas de 4. Cada línea vive su ventana; dentro,
   cada palabra se enciende en su t0. Los tiempos vienen de ElevenLabs. */
function agruparLineas(cues, porLinea = 4) {
  const lineas = [];
  for (let i = 0; i < cues.length; i += porLinea) {
    const grupo = cues.slice(i, i + porLinea);
    lineas.push({ t0: grupo[0].t0, t1: grupo[grupo.length - 1].t1, palabras: grupo });
  }
  // Una línea puede extenderse hasta el inicio de la siguiente, nunca más:
  // dos clips en la misma pista no pueden solaparse.
  const GAP = 1 / FPS;
  for (let i = 0; i < lineas.length; i++) {
    const limite = i + 1 < lineas.length ? lineas[i + 1].t0 - GAP : DUR;
    lineas[i].fin = Math.max(lineas[i].t0 + 0.3, Math.min(lineas[i].t1 + 0.12, limite));
  }
  return lineas;
}
const LINEAS = agruparLineas(CUES);

/* ────────────────────────────── Fragmentos ────────────────────────────── */
const puas = `
  <div class="pua pua-a"></div>
  <div class="pua pua-b"></div>`;

function cardHTML(c) {
  const bg = c.bg === 'blanco' ? 'card-blanco' : c.bg === 'naranja' ? 'card-naranja' : 'card-limpio';
  let dentro = '';

  if (c.serif) {
    dentro = `
      ${c.kicker ? `<div class="kicker" id="${c.id}-k">${esc(c.kicker)}</div>` : ''}
      <div class="tipo-bloque">
        <div class="serif-back" id="${c.id}-sb">${esc(c.serifBack)}</div>
        <div class="serif" id="${c.id}-s1">${esc(c.serif)}</div>
        <div class="serif-acc" id="${c.id}-s2">${esc(c.serifAcc)}</div>
      </div>`;
  } else if (c.dato) {
    dentro = `
      <div class="dato-bloque">
        <div class="dato" id="${c.id}-d">${esc(c.dato)}</div>
        <div class="dato-label" id="${c.id}-l1">${esc(c.datoLabel)}</div>
        <div class="dato-label" id="${c.id}-l2">${esc(c.datoLabel2)}</div>
        <div class="fuente" id="${c.id}-f">${esc(c.fuente)}</div>
      </div>`;
  } else if (c.clave) {
    dentro = `
      <div class="cta-bloque">
        <div class="kicker" id="${c.id}-k">${esc(c.kicker)}</div>
        <div class="clave" id="${c.id}-c">${esc(c.clave)}</div>
      </div>`;
  } else if (c.pasos) {
    dentro = `
      <div class="pasos">
        ${c.pasos.map((p, i) => `<div class="paso" id="${c.id}-p${i}"><b>${i + 1}</b><span>${esc(p)}</span></div>`).join('\n        ')}
      </div>`;
  }
  if (c.badge) {
    dentro += `<div class="badge" id="${c.id}-b">${esc(c.badge)}</div>`;
  }
  if (c.lower) {
    dentro += `
      <div class="lower">
        <div class="lower-1" id="${c.id}-t1">${esc(c.lower)}</div>
        <div class="lower-2" id="${c.id}-t2">${esc(c.lowerAcc)}</div>
      </div>`;
  }

  const deco = c.modo === 'motion' ? puas : '';
  return `<div class="card ${bg}" data-card-id="${c.id}"><div class="root">${deco}${dentro}</div></div>`;
}

/* ──────────────────────────── Ensamblar HTML ──────────────────────────── */
const hostsHTML = CARDS.map((c) => {
  const dur = q(c.t[1] - c.t[0]);
  return `      <div class="card-host clip" id="host-${c.id}" data-card-id="${c.id}"
           data-start="${q(c.t[0]).toFixed(4)}" data-duration="${dur.toFixed(4)}"
           data-track-index="4"
           style="left:0;top:0;width:${W}px;height:${H}px;">
${cardHTML(c)}
      </div>`;
}).join('\n');

const subsHTML = LINEAS.map((ln, i) => {
  const dur = q(ln.fin - ln.t0);
  const palabras = ln.palabras
    .map((p, j) => `<span class="sw" id="sub-${i}-${j}">${esc(p.w)}</span>`)
    .join(' ');
  return `      <div class="sub clip" id="sub-${i}"
           data-start="${q(ln.t0).toFixed(4)}" data-duration="${dur.toFixed(4)}"
           data-track-index="6"><div class="sub-in" id="subin-${i}">${palabras}</div></div>`;
}).join('\n');

/* ───────────────────────────── Línea de tiempo ───────────────────────────── */
const tl = [];
tl.push(`          const tl = window.gsap.timeline({ paused: true });`);

CARDS.forEach((c, idx) => {
  const [a, b] = c.t.map(q);
  const e = ENCUADRE[c.id];
  // El framework controla la visibilidad del .clip; nosotros solo el fundido,
  // y sobre el hijo .card, nunca sobre el propio elemento con clase clip.
  const sel = `'.card-host[data-card-id="${c.id}"] .card'`;
  tl.push(`          tl.fromTo(${sel}, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' }, ${a.toFixed(4)});`);
  tl.push(`          tl.to(${sel}, { opacity: 0, duration: 0.3, ease: 'power2.in' }, ${(b - 0.3).toFixed(4)});`);
  tl.push(`          tl.set(${sel}, { opacity: 0 }, ${b.toFixed(4)});`);   // hard kill: seek seguro

  // Fondo: naranja / blanco / natural
  const fondo = c.modo === 'motion' ? (c.bg === 'blanco' ? '#FFF6EE' : '#FF6A13') : '#14100C';
  tl.push(`          tl.to('#fondo', { backgroundColor: '${fondo}', duration: 0.45, ease: 'power2.inOut' }, ${Math.max(0, a - 0.25).toFixed(4)});`);
  tl.push(`          tl.to('#textura', { opacity: ${c.modo === 'avatar' ? 1 : 0}, duration: 0.45, ease: 'power2.inOut' }, ${Math.max(0, a - 0.25).toFixed(4)});`);
  const rClara = c.modo === 'motion' && c.bg !== 'blanco' ? 0.85 : 0;
  const rOscura = c.bg === 'blanco' ? 1 : 0;
  tl.push(`          tl.to('#rejilla-clara', { opacity: ${rClara}, duration: 0.45, ease: 'power2.inOut' }, ${Math.max(0, a - 0.25).toFixed(4)});`);
  tl.push(`          tl.to('#rejilla-oscura', { opacity: ${rOscura}, duration: 0.45, ease: 'power2.inOut' }, ${Math.max(0, a - 0.25).toFixed(4)});`);

  // Encuadre del avatar — solo transformaciones y opacidad
  tl.push(`          tl.to('#video-wrap', { scale: ${e.s}, y: ${e.y}, opacity: ${e.op}, duration: 0.55, ease: 'power2.inOut' }, ${Math.max(0, a - 0.25).toFixed(4)});`);

  // Animaciones internas por tipo de card
  const at = (o) => (a + o).toFixed(4);
  if (c.serif) {
    if (c.kicker) tl.push(`          tl.fromTo('#${c.id}-k', { opacity: 0, y: -18 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, ${at(0.25)});`);
    tl.push(`          tl.fromTo('#${c.id}-sb', { opacity: 0, scale: 1.12 }, { opacity: 0.22, scale: 1, duration: 0.7, ease: 'power2.out' }, ${at(0.3)});`);
    tl.push(`          tl.fromTo('#${c.id}-s1', { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, ${at(0.45)});`);
    tl.push(`          tl.fromTo('#${c.id}-s2', { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' }, ${at(0.7)});`);
  }
  if (c.dato) {
    tl.push(`          tl.fromTo('#${c.id}-d', { opacity: 0, scale: 0.62 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' }, ${at(0.2)});`);
    tl.push(`          tl.fromTo('#${c.id}-l1', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, ${at(0.6)});`);
    tl.push(`          tl.fromTo('#${c.id}-l2', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, ${at(0.72)});`);
    tl.push(`          tl.fromTo('#${c.id}-f', { opacity: 0 }, { opacity: 0.72, duration: 0.4, ease: 'power2.out' }, ${at(0.95)});`);
  }
  if (c.clave) {
    tl.push(`          tl.fromTo('#${c.id}-k', { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, ${at(0.15)});`);
    tl.push(`          tl.fromTo('#${c.id}-c', { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.8)' }, ${at(0.35)});`);
  }
  if (c.pasos) {
    c.pasos.forEach((_, i) =>
      tl.push(`          tl.fromTo('#${c.id}-p${i}', { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.42, ease: 'power2.out' }, ${at(0.25 + i * 0.3)});`)
    );
  }
  if (c.badge) {
    tl.push(`          tl.fromTo('#${c.id}-b', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }, ${at(0.3)});`);
  }
  if (c.lower) {
    tl.push(`          tl.fromTo('#${c.id}-t1', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, ${at(0.25)});`);
    tl.push(`          tl.fromTo('#${c.id}-t2', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, ${at(0.4)});`);
  }

  // Púas blancas girando en las escenas de motion
  if (c.modo === 'motion') {
    tl.push(`          tl.fromTo('.card[data-card-id="${c.id}"] .pua-a', { opacity: 0, scale: 0.5, rotation: -25 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'power3.out' }, ${at(0.1)});`);
    tl.push(`          tl.fromTo('.card[data-card-id="${c.id}"] .pua-b', { opacity: 0, scale: 0.5, rotation: 25 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.6, ease: 'power3.out' }, ${at(0.2)});`);
  }
});

// Subtítulos karaoke
LINEAS.forEach((ln, i) => {
  const t0 = q(ln.t0), t1 = q(ln.fin);
  tl.push(`          tl.fromTo('#subin-${i}', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }, ${t0.toFixed(4)});`);
  ln.palabras.forEach((p, j) => {
    tl.push(`          tl.to('#sub-${i}-${j}', { color: '#FF8F3C', duration: 0.08, ease: 'none' }, ${q(p.t0).toFixed(4)});`);
  });
  tl.push(`          tl.to('#subin-${i}', { opacity: 0, duration: 0.18, ease: 'power2.in' }, ${(t1 - 0.18).toFixed(4)});`);
  tl.push(`          tl.set('#subin-${i}', { opacity: 0 }, ${t1.toFixed(4)});`);
});

tl.push(`          window.__timelines = window.__timelines || {};`);
tl.push(`          window.__timelines['${ID}'] = tl;`);

/* ─────────────────────────────── El archivo ─────────────────────────────── */
const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>Video AI Studio — prueba de motion graphics</title>
    <style>
      @font-face { font-family: 'Editorial'; src: url('fonts/Georgia-BoldItalic.ttf') format('truetype'); font-weight: 700; font-style: italic; font-display: block; }
      @font-face { font-family: 'EditorialLight'; src: url('fonts/Georgia-Italic.ttf') format('truetype'); font-weight: 400; font-style: italic; font-display: block; }
      @font-face { font-family: 'Inter'; src: url('fonts/Inter-400-latin.woff2') format('woff2'); font-weight: 400; font-display: block; }
      @font-face { font-family: 'Inter'; src: url('fonts/Inter-700-latin.woff2') format('woff2'); font-weight: 700; font-display: block; }

      :root {
        --naranja: #FF6A13;
        --naranja-claro: #FF8F3C;
        --crema: #FFF6EE;
        --tinta: #14100C;
        --blanco: #FFFFFF;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
        background: #000;
        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      }
      #stage { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; }

      /* pista 0 — el fondo. Va en un hijo a pantalla completa, NUNCA en la raíz. */
      #fondo { position: absolute; inset: 0; background: #FF6A13; }
      /* textura cálida: evita que el avatar parezca flotar sobre negro plano */
      #textura {
        position: absolute; inset: 0; opacity: 0;
        background:
          radial-gradient(ellipse 70% 55% at 50% 26%, rgba(255,138,60,.30), transparent 62%),
          radial-gradient(ellipse 90% 60% at 50% 108%, rgba(255,106,19,.22), transparent 60%),
          repeating-linear-gradient(0deg, transparent 0 158px, rgba(255,255,255,.028) 158px 160px),
          repeating-linear-gradient(90deg, transparent 0 158px, rgba(255,255,255,.028) 158px 160px);
      }

      /* pista 1 — avatar con alpha */
      .video-wrapper {
        position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px;
        transform-origin: 50% 50%;
      }
      .video-wrapper video { width: 100%; height: 100%; object-fit: contain; }

      /* pista 4 — cards */
      .card-host { position: absolute; pointer-events: none; overflow: hidden; }
      .card-host .card { position: relative; width: 100%; height: 100%; overflow: hidden; }
      .card .root { position: absolute; inset: 0; }

      /* ── decoración compartida ── */
      /* Las rejillas viven en el FONDO, debajo del avatar. Si van en la card
         se dibujan encima de la cara, que es lo que pasaba antes. */
      #rejilla-clara, #rejilla-oscura { position: absolute; inset: 0; opacity: 0; }
      #rejilla-clara {
        background-image:
          repeating-linear-gradient(0deg, transparent 0 118px, rgba(255,255,255,.5) 118px 120px),
          repeating-linear-gradient(90deg, transparent 0 118px, rgba(255,255,255,.5) 118px 120px);
      }
      #rejilla-oscura {
        background-image:
          repeating-linear-gradient(0deg, transparent 0 118px, rgba(20,16,12,.26) 118px 120px),
          repeating-linear-gradient(90deg, transparent 0 118px, rgba(20,16,12,.26) 118px 120px);
      }
      .pua { position: absolute; background: var(--blanco); }
      .card-blanco .pua { background: var(--naranja); }
      .pua-a { top: -40px; right: -60px; width: 460px; height: 420px;
               clip-path: polygon(100% 0%, 46% 46%, 76% 40%, 30% 74%, 62% 56%, 8% 100%, 100% 30%); }
      .pua-b { bottom: -50px; left: -70px; width: 400px; height: 380px;
               clip-path: polygon(0% 100%, 54% 54%, 24% 60%, 70% 26%, 38% 44%, 92% 0%, 0% 70%); }

      /* ── tipografía editorial ── */
      .kicker {
        position: absolute; top: 150px; left: 72px;
        font: 700 30px/1 'Inter', sans-serif; letter-spacing: .22em;
        text-transform: uppercase; color: var(--blanco); opacity: .9;
      }
      .card-blanco .kicker { color: var(--naranja); }

      .tipo-bloque { position: absolute; left: 72px; right: 72px; top: 300px; }
      .serif-back {
        position: absolute; top: 104px; left: 0; right: 0;
        font: 700 250px/0.82 'Editorial', Georgia, serif; font-style: italic;
        color: var(--blanco); opacity: .22; white-space: nowrap;
        overflow: hidden; text-overflow: clip;
      }
      .serif {
        position: relative; font: 400 92px/1.02 'EditorialLight', Georgia, serif;
        font-style: italic; color: var(--blanco);
      }
      .serif-acc {
        position: relative; margin-top: 6px;
        font: 700 128px/0.98 'Editorial', Georgia, serif; font-style: italic;
        color: var(--blanco); letter-spacing: -.015em;
      }

      /* ── tarjeta de dato ── */
      .dato-bloque { position: absolute; left: 72px; right: 72px; top: 250px; text-align: center; }
      .dato {
        font: 700 300px/0.86 'Editorial', Georgia, serif; font-style: italic;
        color: var(--blanco); letter-spacing: -.03em;
      }
      .card-blanco .dato { color: var(--naranja); }
      .dato-label {
        font: 400 46px/1.25 'EditorialLight', Georgia, serif; font-style: italic;
        color: var(--blanco); opacity: .95;
      }
      .card-blanco .dato-label { color: var(--tinta); }
      .fuente {
        margin-top: 26px; font: 700 22px/1 'Inter', sans-serif;
        letter-spacing: .16em; text-transform: uppercase; color: var(--blanco); opacity: 0;
      }
      .card-blanco .fuente { color: var(--tinta); }

      /* ── CTA ── */
      .cta-bloque { position: absolute; left: 72px; right: 72px; top: 300px; text-align: center; }
      .clave {
        display: inline-block; margin-top: 76px; padding: 26px 54px;
        background: var(--blanco); color: var(--naranja);
        font: 700 96px/1 'Inter', sans-serif; letter-spacing: .04em;
        border-radius: 18px; transform-origin: center;
      }

      /* ── pasos ── */
      .pasos { position: absolute; left: 72px; right: 72px; bottom: 330px; }
      .paso {
        display: flex; align-items: center; gap: 26px; margin-bottom: 26px;
        background: rgba(12,9,6,.94); border-left: 10px solid var(--naranja);
        padding: 26px 32px; border-radius: 6px;
      }
      .paso b {
        font: 700 56px/1 'Editorial', Georgia, serif; font-style: italic;
        color: var(--naranja-claro); min-width: 54px;
      }
      .paso span { font: 400 40px/1.2 'Inter', sans-serif; color: var(--blanco); }

      /* ── badge ── */
      .badge {
        position: absolute; left: 50%; top: 220px; transform: translateX(-50%);
        padding: 24px 46px; background: var(--naranja); color: var(--blanco);
        font: 700 40px/1 'Inter', sans-serif; letter-spacing: .18em;
        text-transform: uppercase; border-radius: 12px; white-space: nowrap;
      }

      /* ── lower third ── */
      .lower { position: absolute; left: 64px; right: 64px; bottom: 620px; }
      .lower-1 {
        font: 400 62px/1.12 'EditorialLight', Georgia, serif; font-style: italic;
        color: var(--blanco); text-shadow: 0 4px 26px rgba(0,0,0,.75);
      }
      .lower-2 {
        margin-top: 8px;
        font: 700 82px/1.05 'Editorial', Georgia, serif; font-style: italic;
        color: var(--naranja-claro); text-shadow: 0 4px 26px rgba(0,0,0,.75);
      }

      /* pista 6 — subtítulos karaoke */
      .sub {
        position: absolute; left: 70px; right: 70px; bottom: 132px;
        text-align: center; font: 700 48px/1.2 'Inter', sans-serif;
        color: var(--blanco); text-shadow: 0 4px 22px rgba(0,0,0,.85);
      }
      .sub .sw { display: inline-block; }
      .sub-in { display: block; }
    </style>
  </head>
  <body>
    <div id="stage"
         data-composition-id="${ID}"
         data-start="0" data-duration="${DUR}"
         data-fps="${FPS}" data-width="${W}" data-height="${H}">

      <div id="fondo"></div>
      <div id="textura"></div>
      <div id="rejilla-clara"></div>
      <div id="rejilla-oscura"></div>

      <div class="video-wrapper" id="video-wrap">
        <video id="avatar" src="avatar.webm" muted playsinline
               data-start="0" data-duration="${DUR}" data-track-index="1"></video>
      </div>

      <audio id="voz" src="voz.mp3"
             data-start="0" data-duration="${DUR}" data-track-index="10" data-volume="1"></audio>

${hostsHTML}

${subsHTML}

      <script src="vendor/gsap.min.js"></script>
      <script>
        (function () {
${tl.join('\n')}
        })();
      </script>
    </div>
  </body>
</html>
`;

writeFileSync(join(DIR, 'public', 'index.html'), html);

console.log('✓ public/index.html generado');
console.log('  escenas      :', CARDS.length, '(transición cada 5 s)');
console.log('  líneas de sub:', LINEAS.length, 'de', CUES.length, 'palabras');
console.log('  duración     :', DUR, 's ·', W + 'x' + H, '·', FPS, 'fps');
console.log('  tweens       :', tl.length - 3);
