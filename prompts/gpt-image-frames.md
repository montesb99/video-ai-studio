# Prompts para GPT Image — 7 pantallas de Video AI Studio

> Listos para pegar. Generar en **16:9, 1536×1024**.
> Última actualización: 25 jul 2026

---

## Cómo usarlos

1. Copia el **preámbulo compartido** (sección 1).
2. Pégalo, y a continuación pega **uno** de los 7 prompts de pantalla.
3. Genera. Repite para cada pantalla.

**Por qué las instrucciones van en inglés y la interfaz en español:** los modelos de imagen obedecen mejor la especificación técnica en inglés, pero renderizan sin problema cadenas literales en español si se les indica explícitamente. Así los frames muestran el producto real, no una versión traducida después.

**Sobre las tildes:** algunos modelos deforman las tildes y la ñ en textos pequeños. Si aparece en los frames, es un artefacto del generador, no una decisión de diseño. El código y el prompt maestro llevan la ortografía correcta.

---

## 1. Preámbulo compartido

> Pégalo delante de **cada** prompt de pantalla.

```
Ultra-detailed UI design mockup of a professional AI SaaS web application,
presented as a floating rounded-corner browser window on a soft neutral grey
studio backdrop with a subtle drop shadow. Dark theme.

LANGUAGE — CRITICAL: every piece of visible interface text is in SPANISH.
Render each quoted string EXACTLY as written, preserving accents and special
characters (á é í ó ú ñ ¿ ¡). Do not translate any label into English. Do not
invent English words anywhere in the UI.

DESIGN SYSTEM (obey exactly):
- Page background #0B0B10. Panels #131320 with 16px radius and 1px
  rgba(255,255,255,0.06) borders. Elevated cards #1A1A2B.
- Primary accent: violet #7C5CFF with a gradient to #B06AF0. Secondary accent:
  warm orange #FF7A2F used sparingly — at most one orange element per screen.
  Success #22C55E. Warning #F59E0B.
- Typography: geometric sans-serif (Inter/Geist). Body 13-14px. Headings 20-24px
  semibold. Hierarchy expressed through weight and opacity, not size jumps.
- Left sidebar 232px wide, fixed: brand mark "Video AI Studio" with a play-spark
  logo at top; nav items with 20px line icons, labeled exactly:
  "Inicio", "Crear video", "Biblioteca", "Identidad de marca", "Plantillas",
  "Integraciones"; then a card titled "Créditos" reading "8.420 / 20.000" with a
  violet progress bar; at the bottom an upgrade block titled "Plan Premium" with
  a violet gradient button "Mejorar plan".
- Top bar (ALWAYS): on the right, a notification bell, a settings gear, and a
  user chip reading "Diego Montes".
- Top bar stepper (ONLY on wizard screens — prompts 2 through 7; it must NOT
  appear on the dashboard): a 6-step numbered progress stepper with connecting
  lines, labeled exactly "1 Idea", "2 Propuestas", "3 Guion", "4 Voz",
  "5 Avatar y marca", "6 Escenas". Completed steps filled violet with a check,
  current step outlined violet.
- Script block colors used consistently everywhere: hook violet #7C5CFF,
  promesa blue #3B82F6, contenido green #22C55E, CTA orange #FF7A2F.
- Numbers use Spanish formatting: period as thousands separator (8.420),
  comma as decimal separator (4,8 %).
- 8px spacing grid, generous padding, no clutter, crisp legible micro-labels.
- Rendering: pixel-perfect flat UI, sharp text, no blur, no lorem-ipsum noise,
  no photographic grain. 16:9 landscape.
```

---

## 2. PROMPT 1 — Panel de rendimiento

> Pantalla 1 · `/dashboard` · **sin stepper**

```
[shared preamble]

SCREEN: the analytics dashboard ("Inicio" is the active nav item).
IMPORTANT: this screen has NO numbered progress stepper anywhere. The top bar
contains only the page title area on the left and the bell / gear / user chip on
the right. This is a performance dashboard, not a creation flow.

Header row: title "Rendimiento" with the subtitle
"Tus publicaciones en Instagram · últimos 30 días".
On the right of the header: a connected-account chip showing a small circular
profile photo and the handle "@diegoinnovacion" with a green dot; next to it a
date-range selector reading "Últimos 30 días"; then a violet gradient button
"+ Crear video".

KPI ROW — five stat tiles, each with a large number, a small Spanish label, a
tiny violet sparkline, and a green or red delta chip. Labeled exactly:
  "Reproducciones"        842.100   +18,4 %
  "Interacciones"          61.480   +12,1 %
  "Alcance"               512.300   +9,7 %
  "Nuevos seguidores"       4.920   +24,3 %
  "Tasa de interacción"      7,3 %   -1,2 %   (this delta chip is red)

MAIN CHART — a wide panel titled "Evolución" with a smooth area chart over 30
days: a violet gradient area for "Reproducciones" and a thinner orange line for
"Interacciones", a subtle horizontal grid, date labels along the x-axis, and a
small legend with two Spanish labels. A floating tooltip is visible on one data
point showing a date and two values.

BELOW, a two-column layout:
LEFT (wider) — a panel titled "Publicaciones" with a small filter row
("Todas", "Reels", "Carruseles") and a list of five publication rows. Each row:
a small vertical 9:16 thumbnail of a stylized talking-head video with bold
Spanish caption text burned in, then the caption's first line, a niche pill
("Finanzas", "IA y Tecnología", "Salud"), the publish date ("18 jul"), and a
right-aligned group of four compact metrics with 16px line icons and Spanish
micro-labels: "Repr. 128.400", "Me gusta 9.240", "Coment. 412",
"Guardados 1.830". The top row has a small violet badge reading "Top".
RIGHT — a panel titled "Mejor rendimiento" showing the single best video as a
large vertical 9:16 thumbnail with its engagement rate "11,2 %" overlaid, its
title underneath, and three small metric rows; below it a compact panel titled
"Cuentas conectadas" with two rows: "Instagram — @diegoinnovacion" (green dot,
label "Conectado") and "TikTok — Sin conectar" (amber dot).
```

---

## 3. PROMPT 2 — Paso 1: Idea

> Pantalla 2 · `/create/[id]/idea` · stepper paso 1

```
[shared preamble]  (stepper: step "1 Idea" active)

SCREEN: the first step of the creation wizard.
Centered content column, max 940px, lots of breathing room.
Title: "¿Qué quieres contar hoy?" with subtitle
"Elige el formato, escribe tu idea y adjunta lo que tengas."

Three selectable format cards side by side, each 280px wide with an illustrated
icon, a title and one line of description, labeled exactly:
  - "Informativo" — "Explica una idea rápido y claro"
                    (icon: layered document with a spark)
  - "Reacción"    — "Reacciona a una tendencia"
                    (icon: split screen with a speech bubble)
  - "Desde un enlace" — "Copia la estructura de un video que te gusta"
                    (icon: chain link)
The "Informativo" card is SELECTED: violet gradient border, subtle violet glow,
a check badge in its corner.

BELOW — the hero element of this screen: a large rounded chat composer panel,
full width of the column, ~180px tall, with a soft violet inner glow on its
border. Inside it:
  - a multi-line text area holding a written Spanish idea, three lines long,
    about artificial intelligence replacing repetitive tasks in small businesses
  - under the text, a horizontal row of three ATTACHMENT CHIPS already added,
    each a small rounded pill with a file-type icon, a truncated name and an "x"
    to remove: a red PDF icon chip reading "informe-ia-2026.pdf · 12 pág.",
    a blue link icon chip reading "elpais.com/tecnologia/...", and a pink
    Instagram glyph chip reading "instagram.com/reel/C8x..."
  - a bottom toolbar inside the composer: on the left, four 20px ghost icon
    buttons with tiny Spanish tooltips — a paperclip ("Adjuntar archivo"), a
    link ("Pegar enlace"), an image ("Imagen"), a microphone ("Nota de voz");
    on the right a small muted counter "3 fuentes" and a violet gradient send
    button with an upward arrow.

BELOW the composer: a compact section titled "Nicho" with a wrapped row of
pill chips labeled exactly: "Finanzas", "IA y Tecnología", "Salud", "Fitness",
"Marketing", "Mentalidad", "Cripto", "Bienes Raíces", "Educación",
"E-commerce". The chip "IA y Tecnología" is selected in violet and carries a
tiny sparkle icon with the muted note "Detectado automáticamente".

Bottom-right: a large violet gradient button "Generar ideas →" with a small
muted label under it reading "Gratis · no consume créditos".
```

---

## 4. PROMPT 3 — Paso 2: Propuestas

> Pantalla 3 · `/create/[id]/propuestas` · stepper paso 2

```
[shared preamble]  (stepper: step "2 Propuestas" active)

SCREEN: title "Elige tu idea" with the subtitle
"3 propuestas para IA y Tecnología · basadas en tus 3 fuentes".
Three tall proposal cards side by side, equal width. Each card contains, top to
bottom:
  - a header row with an approach tag pill and a violet circular gauge showing a
    virality score. The three approach tags read exactly:
    "Storytelling informativo", "Reacción informativa", "Dato duro".
    The three gauges read "82", "91" and "76", each with the small label
    "Viralidad" beneath.
  - a section labeled "GANCHO" in small violet uppercase micro-type, followed by
    a bold two-line Spanish headline in larger semibold text
  - a section labeled "LA IDEA" with three lines of muted Spanish body text
  - a section labeled "POR QUÉ FUNCIONA" with a small lightbulb icon and two
    lines of Spanish text
  - a distinct CTA block with a subtle orange-tinted background: a small label
    "CTA SUGERIDO", an objective pill reading "Leads" (orange) on two cards and
    "Seguidores" (violet) on one, and a quoted Spanish CTA sentence containing a
    highlighted keyword badge showing the uppercase word "IA"
  - a footer row with a clock icon reading "50 s" and a muted "≈ 128 palabras"
The middle card ("Reacción informativa", score 91) is SELECTED: violet gradient
border, soft violet glow, and a check badge. The other two are at 70% opacity.
Bottom bar: a ghost button "Generar otras 3" on the left, and a violet gradient
button "Escribir guion →" on the right.
```

---

## 5. PROMPT 4 — Paso 3: Guion

> Pantalla 4 · `/create/[id]/guion` · stepper paso 3

```
[shared preamble]  (stepper: step "3 Guion" active)

SCREEN: title "Tu guion" with the subtitle "50 segundos · 4 bloques · editable".
Two-column layout.

LEFT COLUMN (wide, the editor) — a document-style editor on a slightly lighter
panel, containing four stacked editable BLOCK CARDS. Each block card has a
colored left border, a small uppercase label with a duration badge on its
header row, a drag handle, and Spanish body text inside:
  - "HOOK"      badge "0:00 – 0:03"  violet left border, one punchy bold line
  - "PROMESA"   badge "0:03 – 0:08"  blue left border, two lines
  - "CONTENIDO" badge "0:08 – 0:43"  green left border, four short numbered
                paragraphs of Spanish body text
  - "CTA FINAL" badge "0:43 – 0:50"  orange left border, one line containing an
                inline highlighted uppercase keyword badge "IA"
Inside the "CONTENIDO" block, one sentence is SELECTED with a violet text
highlight, and a small floating AI toolbar hovers just above it with five
compact ghost buttons labeled exactly: "Acortar", "Más directo", "Subir
tensión", "Reescribir", and a sparkle icon button "IA".

RIGHT COLUMN (320px) — stacked panels:
  - a panel titled "Duración" with a large reading "0:50" and a segmented
    horizontal bar split into four proportional colored segments matching the
    block colors, with a small green check and the note "Dentro del objetivo"
  - a panel titled "Métricas" with three label/value rows: "Palabras 128",
    "Ritmo 2,39 pal/s", "Legibilidad Alta"
  - a panel titled "Asistente" showing two chat-style suggestion bubbles in
    Spanish, each with a small "Aplicar" ghost button
  - a panel titled "Versiones" listing three rows: "v3 · ahora" (active, violet
    dot), "v2 · hace 4 min", "v1 · original"

Bottom bar: a ghost button "Volver a las ideas" on the left; on the right a
large violet gradient button "Confirmar guion →" with the muted note beneath it
"A partir de aquí se usan créditos".
```

---

## 6. PROMPT 5 — Paso 4: Voz

> Pantalla 5 · `/create/[id]/voz` · stepper paso 4

```
[shared preamble]  (stepper: step "4 Voz" active)

SCREEN: title "Voz" with the subtitle "La voz que hablará tu avatar".
Two-column layout.

LEFT COLUMN (wide) — a panel with a small "ElevenLabs" badge in its header and a
search field with the placeholder "Buscar voz...". Below it, two grouped lists,
each preceded by a small uppercase group header:
  - "MIS VOCES" — two rows. Each row: a circular violet play button, the voice
    name, a small violet badge reading "Clonada", a compact violet waveform and
    a duration "0:03". The FIRST row is SELECTED with a violet border, a soft
    glow and a check badge; its name reads "Voz Profesional — Diego".
  - "BIBLIOTECA" — three rows, same layout but grey waveforms, no "Clonada"
    badge, and tag pills reading "Segura", "Cálida", "Narración".
Below the lists, a row labeled "Ajustes de voz" with three segmented preset
buttons reading "Natural", "Enérgico", "Narración" — "Natural" active — and a
small ghost chevron labeled "Avanzado".

RIGHT COLUMN (380px) — the audio panel, titled "Audio del guion":
  - a violet gradient button at the top reading "Generar audio"
  - below it a completed result: a wide horizontal violet audio waveform with a
    playhead, a circular play button, and the readout "0:18 / 0:50"
  - under the waveform, four compact BLOCK ROWS, one per script block, each with
    a colored dot, the block name, its duration, a tiny play icon and a small
    circular-arrow "regenerar" ghost icon. Labeled exactly:
      "Hook       0:03"   (violet dot)
      "Promesa    0:05"   (blue dot)
      "Contenido  0:35"   (green dot)
      "CTA final  0:07"   (orange dot)
  - at the bottom a muted note reading
    "Escucha antes de generar el video. Regenerar un bloque es barato."

Bottom bar: ghost button "Volver al guion" on the left; violet gradient button
"Continuar a Avatar →" on the right.
```

---

## 7. PROMPT 6 — Paso 5: Avatar y marca

> Pantalla 6 · `/create/[id]/avatar` · stepper paso 5

```
[shared preamble]  (stepper: step "5 Avatar y marca" active)

SCREEN: title "Avatar y marca" with the subtitle "Cómo se verá tu video".
Three-column workspace.

LEFT COLUMN (300px) — titled "Avatar" with a small "HeyGen" badge: a 2-column
grid of six portrait thumbnails of stylized professional presenters; the third
is selected with a violet border and a check badge. Below it a horizontal strip
labeled "Looks" with four small outfit variants of the selected avatar, the
second active. UNDER that, a fixed non-editable info row with a small speaker
icon reading exactly "Hablará con: Voz Profesional — Diego" plus a tiny violet
link labeled "Cambiar".

CENTER COLUMN — a large vertical 9:16 live preview frame showing the selected
avatar framed chest-up over a dark gradient background, with bold
yellow-highlighted karaoke subtitles in SPANISH across the lower third, a small
brand logo watermark in the top-right corner, and a thin brand-colored
lower-third bar. A muted caption under the frame reads "Vista previa en vivo".

RIGHT COLUMN (320px) — a panel titled "Marca" with a dropdown at the top reading
"Kit: Diego Innovación", then stacked sections:
  - "Colores": three labeled swatches reading "Primario", "Secundario",
    "Acento" (violet, dark navy, orange) plus a small "+" swatch
  - "Logo": a small dark tile showing a logo mark, with a position selector of
    four tiny corner icons, the top-right one active
  - "Subtítulos": three preview chips labeled "Karaoke", "Bloque", "Pop" —
    "Karaoke" selected — plus a yellow highlight-color swatch
  - "Tipografía": a dropdown reading "Inter Semibold"

BELOW the three columns, spanning the full width — a panel titled "Recursos"
with the subtitle "Sube imágenes o videos. Los colocamos donde mejor encajen."
It contains:
  - a dashed drag-and-drop tile on the left reading "Arrastra imágenes o videos"
    with a small "o busca en tu equipo" sub-label
  - to its right, a horizontal row of four uploaded ASSET CARDS. Each card: a
    thumbnail (two photos, one chart image, one video clip with a play badge and
    the duration "0:06"), an "x" in its corner, and BELOW the thumbnail a small
    violet AI-suggestion pill with a sparkle icon reading exactly, one per card:
      "Sugerido para: Gancho — 00:00"
      "Sugerido para: Dato — 00:15"
      "Sugerido para: Apoyo — 00:28"
      "Sin asignar"
    The last card's pill is grey instead of violet.
  - at the far right, a vertical divider and a compact block with a sparkle icon,
    the label "Escenas sin recurso: 2" and a violet ghost button reading
    "Generar con IA"

Bottom-right: violet gradient button "Continuar a Escenas →".
```

---

## 8. PROMPT 7 — Paso 6: Escenas

> Pantalla 7 · `/create/[id]/escenas` · stepper paso 6

```
[shared preamble]  (stepper: step "6 Escenas" active)

SCREEN: title "Revisa tus escenas" with the subtitle
"6 escenas · 0:50 · 1080x1920 · Plantilla Informativo".

MAIN AREA — a horizontal row of six vertical 9:16 storyboard frames. Each frame
has a caption label underneath and, in its top-left corner, a tiny badge that
reads either "Subido" (grey) or "Generado" (violet with a sparkle). Labels,
exactly:
  "00:00 Gancho — motion completo"      badge "Generado"
  "00:08 Avatar + subtítulos"           badge "Subido"
  "00:16 Dato — motion completo"        badge "Generado"
  "00:24 Avatar + imagen de apoyo"      badge "Subido"
  "00:35 Comparativa — motion"          badge "Generado"
  "00:43 Cierre + CTA"                  badge "Generado"
  frame 1: a bold full-bleed title card with large kinetic Spanish typography on
           a violet-to-orange gradient and geometric motion shapes
  frame 2: the avatar with Spanish karaoke subtitles and a lower-third brand bar
  frame 3: a full-screen animated statistic card with a huge number and a chart
  frame 4: the avatar with a floating photo cutout beside them
  frame 5: a split comparison card with two columns and icons
  frame 6: an end card with the logo, a Spanish follow CTA and an animated arrow
Each frame has a small ghost "regenerar" circular-arrow icon in its bottom-right
corner, and a hairline violet tick mark on its top edge indicating a beat.

BELOW — a MULTI-TRACK timeline editor spanning the full width, with a time ruler
0:00–0:50, a violet playhead at 0:16, and thin vertical dashed BEAT GUIDES every
8 seconds. Track rows, top to bottom, each with a Spanish label on the left:
  "SUBTÍTULOS"      a dense strip of many tiny word-level ticks
  "MOTION GRAPHICS" orange blocks, clearly layered ON TOP, with small
                    transition markers between them
  "RECURSOS"        blue-grey blocks holding tiny image thumbnails
  "AVATAR"          dark violet video blocks with gaps, and a small lock icon
                    next to the track label
  "MÚSICA"          two adjacent green blocks with a crossfade X shape where
                    they meet: the first labeled "Épico inspiracional", the
                    second labeled "Corporate loop"; plus a small speaker icon
  "VOZ"             a slim waveform strip with a small lock icon
A small muted legend under the timeline reads
"Cambio visual cada 8 s · La música baja bajo la voz".

RIGHT PANEL (300px) titled "Resumen": label/value rows reading "Plantilla",
"Nicho", "Avatar", "Voz", "Marca", "Música", "Formato",
"Créditos estimados  14"; then a full-width violet gradient button
"Generar video" with the muted note
"Recibirás el MP4 y el proyecto abierto en el editor."
```

---

## 9. Qué revisar en los frames

Antes de dar por buenos los resultados, comprueba:

| Punto | Por qué importa |
|---|---|
| **El stepper NO aparece en el dashboard** | Es el error más probable del modelo. El panel es de rendimiento, no de creación |
| Las etiquetas del stepper dicen `1 Idea · 2 Propuestas · 3 Guion · 4 Voz · 5 Avatar y marca · 6 Escenas` | Define el flujo entero |
| Los números usan punto de miles y coma decimal | `8.420` y `7,3 %`, no `8,420` ni `7.3%` |
| Solo hay **un** elemento naranja por pantalla | El naranja es acento, no segundo primario |
| Los colores de bloque son consistentes | Hook violeta, promesa azul, contenido verde, CTA naranja — en el editor, el audio y el timeline |
| Las pistas AVATAR y VOZ llevan candado | Comunica que están bloqueadas a propósito |
| Las guías de beat aparecen cada 8 s | Es una regla de producto, no decoración |
| Nada está en inglés | Si aparece "Dashboard" o "Continue", el prompt no se obedeció |

---

## 10. Siguiente paso

Cuando los 7 frames estén aprobados, se escribe `prompts/CLAUDE-DESIGN-MASTER.md` con las **13 pantallas**, calibrado contra estos frames. Ese es el entregable final.

Ese prompt maestro incluirá: los tokens de [`05-DESIGN-TOKENS.md`](../docs/05-DESIGN-TOKENS.md), la especificación pantalla por pantalla con todos los textos de [`06-COPY-ES.md`](../docs/06-COPY-ES.md), los cuatro estados (vacío, cargando, error, parcial), el comportamiento responsive y el mapa de navegación.
