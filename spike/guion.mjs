/**
 * Guion final — "La cuenta regresiva" (Formato D · noticia con CTA de comunidad)
 * Tema: el plazo del 10 de septiembre de 2026 del Reglamento de la Ley de IA.
 *
 * ⚠ REGLA CENTRAL (docs/07-METODOLOGIA-GUION.md §3-bis):
 * `spoken` es SOLO lo que dice el avatar. Nada de etiquetas de bloque, tiempos,
 * títulos ni fuentes: eso se leería en voz alta. Las fuentes van en `onScreen`,
 * como texto superpuesto por el motion graphics.
 *
 * `spoken` ya viene NORMALIZADO PARA TTS: cifras y siglas escritas como se
 * pronuncian ("diez de septiembre", no "10/09"; "innovación", no "INNOVACION"),
 * porque el sintetizador lee caracteres, no intención.
 *
 * 📎 Fuentes verificadas
 * - DS 115-2025-PCM, Reglamento de la Ley 31814 — PCM / gob.pe (2025)
 * - Cronograma sectorial y obligaciones — EY Perú, Tax Alert (2026)
 * - Primer reglamento general de IA en Latam, vigencia 22 ene 2026 — Garrigues (2026)
 */

export const TITULO_STOP_SCROLL = '⏰ Tu negocio tiene 6 SEMANAS para cumplir la LEY de IA 🇵🇪';

export const GUION = {
  hook: {
    spoken:
      'Si tu negocio usa inteligencia artificial y estás en finanzas, salud o ' +
      'educación, te quedan seis semanas para cumplir la ley.',
    onScreen: {
      titulo: '⏰ 6 SEMANAS para cumplir la LEY de IA',
      fuente: null,
    },
  },

  promise: {
    // Cierre de promesa: "Toma nota." — seco, sin "al final".
    spoken:
      'Perú es el primer país de Latinoamérica con un reglamento de inteligencia ' +
      'artificial y nadie te lo está explicando en simple. Toma nota.',
    onScreen: {
      titulo: '🇵🇪 PRIMER país de Latam con reglamento de IA',
      fuente: 'DS 115-2025-PCM · vigente desde ene 2026',
    },
  },

  content: [
    {
      spoken:
        'El plazo vence el diez de septiembre y te pide tres cosas. Uno: avisar. ' +
        'Si tu cliente le escribe a un bot, tienes que decírselo claro y antes.',
      onScreen: {
        dato: '10 SET',
        etiqueta: 'vence el primer plazo',
        fuente: 'EY Perú · Tax Alert 2026',
      },
    },
    {
      spoken:
        'Dos: que una persona pueda revisar lo que decide tu inteligencia ' +
        'artificial, sobre todo si define a quién contratas.',
      onScreen: {
        dato: '2',
        etiqueta: 'Supervisión humana obligatoria',
        fuente: null,
      },
    },
    {
      spoken:
        'Y tres: guardar por escrito cómo la usas. Si eres pyme, esto no te ' +
        'cuesta plata: te cuesta una tarde.',
      onScreen: {
        dato: '3',
        etiqueta: 'Documenta cómo la usas',
        fuente: null,
      },
    },
  ],

  cta: {
    spoken:
      '¿Sabías que ya existe esta ley? Comenta innovación y te mando la guía de ' +
      'cumplimiento en mi comunidad, gratis.',
    onScreen: {
      palabraClave: 'INNOVACION',
      fuente: null,
    },
  },
};

/** Los bloques en orden, con su nombre para mapear tiempos y regenerar uno solo. */
export const BLOQUES = [
  { id: 'hook', label: 'Hook', spoken: GUION.hook.spoken },
  { id: 'promise', label: 'Promesa', spoken: GUION.promise.spoken },
  ...GUION.content.map((c, i) => ({
    id: `content-${i + 1}`,
    label: `Contenido ${i + 1}`,
    spoken: c.spoken,
  })),
  { id: 'cta', label: 'CTA', spoken: GUION.cta.spoken },
];

/** SOLO la voz en off. Es lo único que se le manda al sintetizador. */
export const guionPlano = () => BLOQUES.map((b) => b.spoken).join(' ');
