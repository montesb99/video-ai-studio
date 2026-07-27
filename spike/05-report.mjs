// Paso 5 — Reunir todo lo aprendido en un reporte.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, readOut, save, log, OUT } from './lib.mjs';

loadEnv();
log.title('Paso 5 · Reporte del spike');

const hg = readOut('01-heygen-audit.json');
const el = readOut('02-elevenlabs-voices.json');
const au = readOut('03-elevenlabs-summary.json');
const vi = readOut('04-heygen-result.json');

const has = (f) => existsSync(join(OUT, f));
const si = (x) => (x ? '✅' : '⬜');

const md = `# Reporte del Spike 0 — Video AI Studio

Generado: ${new Date().toISOString().slice(0, 16).replace('T', ' ')}

---

## Resultado

| Comprobación | Estado |
|---|---|
| Cuenta de HeyGen accesible | ${si(hg)} |
| Algún look soporta Avatar III | ${si(hg?.supportsAvatarIII?.length)} |
| Algún look con matting (fondo transparente) | ${si(hg?.mattingEnabled?.length)} |
| Voces de ElevenLabs accesibles | ${si(el)} |
| Voz clonada propia disponible | ${si(el?.professional?.length || el?.cloned?.length)} |
| Audio generado con tiempos por palabra | ${si(au)} |
| **HeyGen aceptó audio externo** | ${si(vi)} |
| Video en webm 9:16 descargado | ${si(has('avatar.webm'))} |

---

## HeyGen

${hg ? `- Endpoint usado: \`${hg.endpoint}\`
- Avatares o looks: **${hg.total}**
- Soportan \`avatar_iii\`: **${hg.supportsAvatarIII?.length ?? 0}**
- Con matting: **${hg.mattingEnabled?.length ?? 0}**
- Look usado: \`${hg.recommended?.name ?? '—'}\`` : '_Paso 1 no ejecutado._'}

## ElevenLabs

${el ? `- Voces totales: **${el.total}**
- Clonadas profesionalmente: **${el.professional?.length ?? 0}**
- Otras clonadas: **${el.cloned?.length ?? 0}**
- Voz usada: \`${el.recommended?.name ?? '—'}\` (${el.recommended?.category ?? '—'})` : '_Paso 2 no ejecutado._'}

## Audio y tiempos

${au ? `| Métrica | Valor | Estimábamos |
|---|---|---|
| Duración real | **${au.duracionSegundos} s** | 50 s |
| Palabras | ${au.palabras} | ~130 |
| Ritmo | **${au.ritmoPalabrasPorSegundo} pal/s** | 2,6 pal/s |
| Tiempo de síntesis | ${au.segundosDeGeneracion} s | 20–60 s |

**Beats de 8 s** (desplazados a límite de palabra para no cortar a mitad):

${au.beats?.map((b) => `- ${b.ideal}s → **${b.real.toFixed(2)}s** (antes de "${b.palabra}")`).join('\n') ?? '—'}

> Si el ritmo real difiere mucho de 2,6 pal/s, hay que ajustar el contador de
> duración del editor de guion (paso 3 del wizard) con este valor medido.` : '_Paso 3 no ejecutado._'}

## Video del avatar

${vi ? `- \`video_id\`: \`${vi.videoId}\`
- Engine: \`${vi.engine}\` · ${vi.aspectRatio} · ${vi.resolution} · \`${vi.outputFormat}\`
- Tiempo de render: **${vi.segundosDeRender} s**

**Rellena tú, mirando el archivo y tu cuenta:**

| Pregunta | Respuesta |
|---|---|
| ¿Labios sincronizados? | |
| ¿Fondo transparente o negro sólido? | |
| Créditos consumidos | |` : '_Paso 4 no ejecutado._'}

---

## Siguiente: componer con HyperFrames

Los tres ingredientes ya existen en \`spike/out/\`:

| Archivo | Pista |
|---|---|
| \`avatar.webm\` | Avatar con alpha |
| \`voz.mp3\` | Voz (siempre en \`<audio>\` aparte) |
| \`cues.json\` | Subtítulos karaoke |
| \`beats.json\` | Cambios visuales cada 8 s |

\`\`\`bash
npx hyperframes init spike-composicion --non-interactive --example=basic
# copiar avatar.webm, voz.mp3 y las imágenes a spike-composicion/assets/
npx hyperframes check
npx hyperframes preview
npx hyperframes render --quality high --output spike/out/final.mp4
\`\`\`

Recordatorios del contrato de HyperFrames:

- El \`<video>\` va **muted**; el sonido siempre en un \`<audio>\` aparte
- El fondo a pantalla completa va en un hijo \`position:absolute; inset:0\`, **nunca** en la raíz — si no, el frame sale negro
- Una sola timeline GSAP pausada en \`window.__timelines["<id>"]\`
- Sin relojes de render, sin \`Math.random\` sin semilla, sin \`repeat: -1\`

---

## Decisiones que dependen de este reporte

1. **Si NO hay matting** → replantear la capa visual: sin alpha no se puede poner
   motion graphics detrás del avatar. Afecta a la pantalla de Escenas.
2. **Si el ritmo real ≠ 2,6 pal/s** → ajustar el contador de duración del editor.
3. **Con los créditos reales** → cerrar el número de "Créditos estimados" del paso 6
   y los precios de los planes.
`;

save('REPORTE.md', md);
log.ok('Guardado en spike/out/REPORTE.md');
log.blank();
log.info('Ábrelo, rellena las 3 preguntas del final y pásamelo.');
