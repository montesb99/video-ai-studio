# Prompt maestro para Claude Design — Video AI Studio

> Pégalo completo. Genera las 13 pantallas de la aplicación.
> Última actualización: 26 jul 2026 · calibrado contra el Spike 0

---

## Cómo usarlo

Este archivo **es** el prompt. Cópialo entero y pégalo en Claude Design.

Si prefieres ir por partes: pega las secciones 1–5 (contexto, sistema de diseño, reglas, navegación) y luego una pantalla por vez de la sección 6. Las secciones 1–5 son obligatorias en todos los casos: sin ellas cada pantalla saldrá con un criterio distinto.

---

# PROMPT

Diseña la interfaz completa de **Video AI Studio**, una aplicación web SaaS en español.

## 1. Qué es el producto

Video AI Studio convierte una idea en un video vertical listo para publicar en Instagram y TikTok: guion viral, avatar hablando con la voz clonada del usuario, motion graphics, música y branding. El usuario **no toca un editor de video**.

**Para quién:** creadores de contenido, agencias pequeñas e infoproductores. **No son técnicos.** Muchos nunca han editado un video.

**El anti-usuario** es el editor profesional que quiere control frame a frame. No diseñes para él. Cada vez que dudes entre *más control* y *menos pasos*, gana **menos pasos**.

**Salida del producto:** MP4 vertical de 1080×1920, ~50 segundos.

## 2. Sistema de diseño

Tema **oscuro únicamente**. No diseñes variante clara.

### Superficies

| Token | Valor | Uso |
|---|---|---|
| `--surface-base` | `#0B0B10` | Fondo de página |
| `--surface-panel` | `#131320` | Paneles y tarjetas |
| `--surface-raised` | `#1A1A2B` | Tarjetas elevadas, filas activas |
| `--surface-overlay` | `#202034` | Menús, tooltips, modales |
| `--surface-input` | `#0F0F1A` | Campos de formulario |

### Bordes

`--border-subtle: rgba(255,255,255,0.06)` · `--border-default: rgba(255,255,255,0.10)` · `--border-strong: rgba(255,255,255,0.16)`

### Texto

| Token | Valor |
|---|---|
| `--text-primary` | `#F4F4F8` |
| `--text-secondary` | `rgba(244,244,248,0.68)` |
| `--text-muted` | `rgba(244,244,248,0.44)` |
| `--text-disabled` | `rgba(244,244,248,0.26)` |

### Acentos

| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#7C5CFF` | Acción primaria, selección, foco |
| `--accent-to` | `#B06AF0` | Fin del gradiente |
| `--accent-soft` | `rgba(124,92,255,0.14)` | Fondo de selección |
| `--accent-border` | `rgba(124,92,255,0.45)` | Borde de elemento activo |
| `--accent-2` | `#FF7A2F` | Naranja, secundario **puntual** |

`--gradient-accent: linear-gradient(135deg, #7C5CFF 0%, #B06AF0 100%)`

> **Regla del naranja: máximo un elemento naranja por pantalla.** Es un acento, no un segundo primario. Si compite con el violeta, la jerarquía se rompe.

> **Por qué la app es violeta y los videos que produce son naranjas:** el violeta es la marca de la herramienta; los colores del video salen del Brand Kit **del usuario**. Una agencia usará la app con los colores de cada cliente. La interfaz nunca impone su color al contenido.

### Semánticos

`--success: #22C55E` · `--warning: #F59E0B` · `--danger: #EF4444` · `--info: #3B82F6`. Cada uno con variante `-soft` al 14 % para fondos de aviso.

### Colores de bloque de guion

**Consistentes en toda la aplicación** — editor, panel de audio, timeline, storyboard:

| Bloque | Valor |
|---|---|
| Hook | `#7C5CFF` violeta |
| Promesa | `#3B82F6` azul |
| Contenido | `#22C55E` verde |
| CTA final | `#FF7A2F` naranja |

### Colores de pista del timeline

Subtítulos `#A78BFA` · Motion graphics `#FF7A2F` · Recursos `#64748B` · Avatar `#5B3FD6` · Música `#22C55E` · Voz `#94A3B8`.

Avatar y Voz llevan además opacidad reducida y un icono de candado.

### Tipografía

Inter (o Geist). Sans geométrica.

| Token | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| `display` | 32 / 38 px | 600 | Título grande |
| `h1` | 24 / 30 px | 600 | Título de pantalla |
| `h2` | 20 / 26 px | 600 | Sección |
| `h3` | 16 / 22 px | 600 | Tarjeta |
| `body` | 14 / 21 px | 400 | Cuerpo |
| `body-sm` | 13 / 19 px | 400 | Cuerpo denso |
| `label` | 12 / 16 px | 500 | Etiquetas |
| `micro` | 11 / 14 px | 500 | Metadatos, insignias |
| `overline` | 11 / 14 px | 600, tracking 0.06em, MAYÚSCULAS | GANCHO, LA IDEA, MIS VOCES |

**La jerarquía se expresa por peso y opacidad, no por saltos de tamaño.** Entre `body` y `h3` hay 2 px; la diferencia real la marca el peso.

### Espaciado, radio, elevación

Rejilla de 8 px. Tokens: 4, 8, 12, 16, 24, 32, 48, 64.

Radios: 8 px (insignias) · 12 px (botones, campos) · 16 px (paneles) · 20 px (modales, composer) · pill.

```
--shadow-md:   0 4px 12px rgba(0,0,0,0.35)
--shadow-lg:   0 12px 32px rgba(0,0,0,0.45)
--glow-accent: 0 0 0 1px rgba(124,92,255,0.45), 0 0 24px rgba(124,92,255,0.18)
```

`--glow-accent` es **la firma de elemento seleccionado**: tarjeta de formato, propuesta elegida, voz activa, avatar elegido.

### Layout

Sidebar 232 px · panel derecho 300–320 px · barra superior 64 px · contenido máx. 1440 px · wizard máx. 940 px.

Breakpoints: 640 / 768 / 1024 / 1280 / 1536.

## 3. Reglas globales

### Idioma

**Toda la interfaz en español latino.** Sin excepciones, sin espanglish innecesario. Sí se conservan los términos que el usuario ya conoce en inglés: *reel*, *hook*, *storyboard*, *branding*, *look*.

- Segunda persona, tuteo: "Escribe tu idea", nunca "Escriba su idea"
- Verbos de acción: "Crear video", no "Creación de video"
- **Sin signos de exclamación.** Es una herramienta, no un anuncio
- Tildes siempre, también en mayúsculas: `EDUCACIÓN`, no `EDUCACION`

### Formatos numéricos

| Tipo | Formato | Ejemplo |
|---|---|---|
| Miles | Punto | `8.420` · `842.100` |
| Decimal | Coma | `7,3 %` · `2,39 pal/s` |
| Porcentaje | Espacio antes del `%` | `18,4 %` |
| Duración corta | `m:ss` | `0:50` |
| Duración larga | `Xm Ys` | `3 m 29 s` |
| Fecha corta | día + mes en minúscula | `18 jul` |
| Relativo | "hace X" | `hace 2 h` |
| Delta positivo | `+` y verde | `+18,4 %` |
| Delta negativo | `−` (menos tipográfico) y rojo | `−1,2 %` |

### Los cuatro estados obligatorios

Toda pantalla que carga datos define los cuatro. **Ninguno se improvisa.**

| Estado | Regla |
|---|---|
| **Vacío** | Ilustración + una frase que explique qué falta + una acción. **Nunca una tabla vacía** |
| **Cargando** | Skeleton con la forma del contenido real. **Nunca un spinner centrado** |
| **Error** | Qué pasó en lenguaje llano + qué puede hacer + reintentar |
| **Parcial** | Lo que hay + aviso ámbar de lo que falta. **Nunca se bloquea todo por un fallo parcial** |

### Mensajes de error

**Nunca se expone el error técnico del proveedor.**

| Real | Lo que ve el usuario |
|---|---|
| `429 rate_limit_exceeded` | "Tu cuenta de ElevenLabs alcanzó su límite. Inténtalo en unos minutos." |
| `401 invalid_api_key` | "Tu clave de HeyGen ya no es válida. Vuelve a conectarla." |
| `401 missing_permissions` | "A tu clave le falta el permiso `text_to_speech`." |
| `402 insufficient_credit` | "Tu cuenta de HeyGen se quedó sin créditos." |
| `insufficient_credits` (nuestros) | "No te alcanzan los créditos. Necesitas 14 y tienes 8." |

### Indicadores de estado

Punto de 8 px **+ texto siempre**. El color nunca es el único portador de significado.

## 4. Arquitectura de navegación

Hay **tres zonas y no se mezclan**:

| Zona | Pantallas | Responde |
|---|---|---|
| **Análisis** | 1, 11, 13 | *¿Cómo va mi contenido?* |
| **Creación** | 2–9 | *¿Cómo hago el siguiente?* |
| **Configuración** | 10, 12 | *¿Cómo está montado esto?* |

```
                  ┌──────────────────┐
                  │  1 · Inicio      │  panel de rendimiento
                  │  (Instagram)     │  ← SIN stepper
                  └────────┬─────────┘
                           │ "+ Crear video"
                           ▼
 ╔═══════════ WIZARD · stepper de 6 pasos ═══════════╗
 ║ 2 Idea → 3 Propuestas → 4 Guion → 5 Voz →         ║
 ║          6 Avatar y marca → 7 Escenas             ║
 ╚═════════════════════┬═════════════════════════════╝
                       ▼
            ┌──────────────────┐      ┌──────────────┐
            │  8 · Generando   │ ───► │  9 · Listo   │
            └──────────────────┘      └──────────────┘

 Laterales, siempre en el sidebar:
 10 Integraciones · 11 Biblioteca · 12 Ajustes · 13 Detalle publicación
```

### Sidebar — 232 px, fijo, en todas las pantallas

```
  Video AI Studio            ← marca con logo de play + destello
  ─────────────────
  Inicio
  Crear video
  Biblioteca
  Identidad de marca
  Plantillas
  Integraciones
  ─────────────────
  Créditos
  8.420 / 20.000
  ▓▓▓▓▓▓░░░░              ← barra con --gradient-accent
  ─────────────────
  Plan Premium
  [ Mejorar plan ]
```

### Barra superior

Siempre: campana de notificaciones, engranaje de ajustes, chip de usuario "Diego Montes".

**Solo en las pantallas 2–7**: stepper numerado de 6 pasos con líneas conectoras, etiquetado exactamente `1 Idea · 2 Propuestas · 3 Guion · 4 Voz · 5 Avatar y marca · 6 Escenas`. Completado: círculo relleno violeta con check. Actual: borde violeta de 2 px. Pendiente: borde tenue, texto apagado.

> ⚠ **El stepper NO aparece en el panel principal.** Es el error más probable. El panel es de rendimiento, no de creación.

---

## 5. Las 13 pantallas

---

### Pantalla 1 · Panel de rendimiento — `/dashboard`

**Rol:** responder *"¿cómo va mi contenido?"* en cinco segundos. **Sin stepper.**

**Cabecera:** título `Rendimiento`, subtítulo `Tus publicaciones en Instagram · últimos 30 días`. A la derecha: chip de cuenta conectada con foto circular y `@diegoinnovacion` con punto verde; selector de rango `Últimos 30 días`; botón violeta `+ Crear video`.

**Fila de KPIs** — cinco tarjetas, cada una con número grande, etiqueta, sparkline violeta y chip de variación:

```
Reproducciones   842.100   +18,4 %
Interacciones     61.480   +12,1 %
Alcance          512.300    +9,7 %
Nuevos seguidores  4.920   +24,3 %
Tasa de interacción  7,3 %  −1,2 %   ← este en rojo
```

**Gráfico** — panel `Evolución`: área con gradiente violeta para Reproducciones, línea naranja fina para Interacciones, rejilla horizontal sutil, tooltip flotante visible en un punto.

**Dos columnas debajo:**

- **Izquierda (más ancha)** — panel `Publicaciones`, filtros `Todas · Reels · Carruseles`, lista de cinco filas. Cada fila: miniatura vertical 9:16, primera línea del caption, pill de nicho (`Finanzas`, `IA y Tecnología`, `Salud`), fecha (`18 jul`) y cuatro métricas compactas con icono: `Repr. 128.400`, `Me gusta 9.240`, `Coment. 412`, `Guardados 1.830`. La primera lleva insignia violeta `Top`.
- **Derecha** — panel `Mejor rendimiento` con la miniatura 9:16 del mejor video, su tasa `11,2 %` superpuesta y tres métricas. Debajo, panel `Cuentas conectadas`: `Instagram — @diegoinnovacion` (verde, `Conectado`) y `TikTok — Sin conectar` (ámbar).

**Estados:**
- Sin Instagram conectado → ilustración + *"Conecta tu Instagram para ver cómo rinde tu contenido"* + botón. **Los KPIs no se muestran en gris: no se muestran.**
- Conectado sin publicaciones → *"Cuando publiques tu primer video, sus métricas aparecen aquí."*
- Sincronizando → KPIs en skeleton + *"Actualizando métricas..."*
- Error → últimos datos + aviso ámbar *"Última actualización: hace 14 h"*

---

### Pantalla 2 · Idea — `/create/[id]/idea` — stepper paso 1

**Rol:** capturar el tipo de video y la idea con todo el material que el usuario tenga.

Columna centrada, máx. 940 px, mucho aire.

**Título:** `¿Qué quieres contar hoy?` · **Subtítulo:** `Elige el formato, escribe tu idea y adjunta lo que tengas.`

**Tres tarjetas de formato** de 280 px, con icono ilustrado, título y una línea:

| Título | Descripción | Icono |
|---|---|---|
| `Informativo` | `Explica una idea rápido y claro` | documento en capas con destello |
| `Reacción` | `Reacciona a una tendencia` | pantalla partida con bocadillo |
| `Desde un enlace` | `Copia la estructura de un video que te gusta` | eslabón de cadena |

`Informativo` seleccionada: borde con gradiente violeta, `--glow-accent` y check en la esquina.

**El elemento protagonista de la pantalla** — un composer de chat grande, redondeado, ancho completo, ~180 px de alto, con brillo violeta suave en el borde. Contiene:

- Área de texto multilínea con una idea escrita de tres líneas, sobre inteligencia artificial reemplazando tareas repetitivas en negocios pequeños
- Debajo, tres **chips de adjunto** ya añadidos, cada uno con icono de tipo, nombre truncado y una "x": chip rojo de PDF `informe-ia-2026.pdf · 12 pág.`, chip azul de enlace `elpais.com/tecnologia/...`, chip rosa de Instagram `instagram.com/reel/C8x...`
- Barra inferior dentro del composer: a la izquierda cuatro iconos fantasma de 20 px con tooltip — clip (`Adjuntar archivo`), enlace (`Pegar enlace`), imagen (`Imagen`), micrófono (`Nota de voz`). A la derecha, contador `3 fuentes` y botón violeta de enviar con flecha hacia arriba

**Sección `Nicho`** — chips pill: `Finanzas`, `IA y Tecnología`, `Salud`, `Fitness`, `Marketing`, `Mentalidad`, `Cripto`, `Bienes Raíces`, `Educación`, `E-commerce`. `IA y Tecnología` seleccionado en violeta con icono de destello y la nota `Detectado automáticamente`.

**Abajo a la derecha:** botón violeta `Generar ideas →` con la nota `Gratis · no consume créditos`.

**Comportamiento:** entrada única, sin repreguntas. Cada adjunto muestra su estado: procesando (spinner), listo (check), fallido (× rojo con motivo). Si `Desde un enlace` está activo, el enlace es obligatorio y el botón queda inhabilitado sin él.

---

### Pantalla 3 · Propuestas — `/create/[id]/propuestas` — stepper paso 2

**Rol:** elegir qué historia contar. **Es una de las dos únicas decisiones reales del flujo.**

**Título:** `Elige tu idea` · **Subtítulo:** `3 propuestas para IA y Tecnología · basadas en tus 3 fuentes`

Tres tarjetas altas de igual ancho. Cada una, de arriba abajo:

1. Cabecera con pill de enfoque y medidor circular violeta de viralidad. Los tres enfoques: `Storytelling informativo`, `Reacción informativa`, `Dato duro`. Los medidores: `82`, `91`, `76`, cada uno con la etiqueta `Viralidad` debajo
2. Sección `GANCHO` en overline violeta, seguida de un titular en dos líneas, semibold, tamaño mayor
3. Sección `LA IDEA` con tres líneas de texto apagado
4. Sección `POR QUÉ FUNCIONA` con icono de bombilla y dos líneas
5. **Bloque de CTA con fondo naranja tenue**: etiqueta `CTA SUGERIDO`, pill de objetivo `Leads` (naranja) en dos tarjetas y `Seguidores` (violeta) en una, y una frase entrecomillada que contiene una **insignia resaltada con la palabra `INNOVACION`**
6. Pie con icono de reloj `50 s` y `≈ 128 palabras`

La tarjeta central (`Reacción informativa`, 91) seleccionada con `--glow-accent` y check. Las otras dos al 70 % de opacidad.

**Barra inferior:** botón fantasma `Generar otras 3` a la izquierda, botón violeta `Escribir guion →` a la derecha.

---

### Pantalla 4 · Guion — `/create/[id]/guion` — stepper paso 3

**Rol:** dejar el texto exacto. **Segunda decisión real y punto de no retorno.**

**Título:** `Tu guion` · **Subtítulo:** `50 segundos · 4 bloques · editable`

**Columna izquierda (ancha)** — editor tipo documento sobre panel algo más claro, con cuatro **tarjetas de bloque** apiladas. Cada una con borde izquierdo de color, etiqueta en overline con insignia de duración, y asa de arrastre:

| Bloque | Duración | Borde | Contenido |
|---|---|---|---|
| `HOOK` | `0:00 – 0:03` | violeta | una línea contundente |
| `PROMESA` | `0:03 – 0:08` | azul | dos líneas |
| `CONTENIDO` | `0:08 – 0:43` | verde | cuatro párrafos numerados cortos |
| `CTA FINAL` | `0:43 – 0:50` | naranja | una línea con insignia `INNOVACION` en línea |

Dentro de `CONTENIDO`, una frase **seleccionada** con resaltado violeta, y justo encima una **barra flotante de IA** con cinco botones compactos: `Acortar`, `Más directo`, `Subir tensión`, `Reescribir`, y un botón de destello `IA`.

**Columna derecha (320 px)** — paneles apilados:

- `Duración`: lectura grande `0:50`, barra horizontal segmentada en cuatro tramos proporcionales con los colores de bloque, check verde y nota `Dentro del objetivo`
- `Métricas`: `Palabras 128` · `Ritmo 2,39 pal/s` · `Legibilidad Alta`
- `Asistente`: dos burbujas de sugerencia con botón `Aplicar`
- `Versiones`: `v3 · ahora` (activa, punto violeta), `v2 · hace 4 min`, `v1 · original`

**Barra inferior:** `Volver a las ideas` a la izquierda; a la derecha botón violeta `Confirmar guion →` con la nota **`A partir de aquí se usan créditos`**.

---

### Pantalla 5 · Voz — `/create/[id]/voz` — stepper paso 4

**Rol:** que el usuario entienda sin que nadie se lo explique que *este es el audio exacto que dirá su avatar*.

**Título:** `Voz` · **Subtítulo:** `La voz que hablará tu avatar`

**Columna izquierda (ancha)** — panel con insignia `ElevenLabs` y campo de búsqueda `Buscar voz...`. Dos listas agrupadas:

- Cabecera `MIS VOCES` — dos filas. Cada una: botón circular violeta de play, nombre, insignia violeta `Clonada`, forma de onda violeta compacta, duración `0:03`. **La primera seleccionada** con borde violeta, glow y check; se llama `Voz Profesional — Diego`
- Cabecera `BIBLIOTECA` — tres filas iguales pero con onda gris, sin insignia, y pills de tono `Segura`, `Cálida`, `Narración`

Debajo, fila `Ajustes de voz` con tres botones segmentados `Natural`, `Enérgico`, `Narración` — `Natural` activo — y un chevron `Avanzado`.

**Columna derecha (380 px)** — panel `Audio del guion`:

- Botón violeta `Generar audio` arriba
- Resultado ya generado: forma de onda violeta ancha con cabezal, botón circular de play y lectura `0:18 / 0:50`
- Debajo, cuatro **filas de bloque**, cada una con punto de color, nombre, duración, icono de play y un icono fantasma de flecha circular para regenerar:
  ```
  Hook       0:03    (punto violeta)
  Promesa    0:05    (punto azul)
  Contenido  0:35    (punto verde)
  CTA final  0:07    (punto naranja)
  ```
- Nota apagada al pie: `Escucha antes de generar el video. Regenerar un bloque es barato.`

**Barra inferior:** `Volver al guion` · `Continuar a Avatar →`

**Estados que hay que diseñar:**
- Sin ElevenLabs conectado → panel bloqueado + *"Conecta tu cuenta de ElevenLabs"* + enlace a Integraciones
- Sin voces clonadas → grupo `MIS VOCES` con *"Todavía no tienes voces propias"* + botón `Clonar mi voz`
- Generando → barra de progreso por bloque, botón inhabilitado
- Un bloque falló → ese bloque en rojo con icono de reintentar, los demás intactos
- **Modo sin preview** (algunas cuentas no lo permiten) → el panel derecho se sustituye por un aviso: *"Escucharás la voz en el video final. Tu cuenta de HeyGen no permite previsualizar aquí."*

---

### Pantalla 6 · Avatar y marca — `/create/[id]/avatar` — stepper paso 5

**Rol:** una sola pregunta — *cómo se ve mi video*. Look y branding **no se separan**.

**Título:** `Avatar y marca` · **Subtítulo:** `Cómo se verá tu video`

**Columna izquierda (300 px)** — `Avatar` con insignia `HeyGen`: rejilla de 2 columnas con seis miniaturas de presentadores; la tercera seleccionada con borde violeta y check. Debajo, tira horizontal `Looks` con cuatro variantes de vestuario, la segunda activa.

Bajo eso, una **fila fija no editable** con icono de altavoz: `Hablará con: Voz Profesional — Diego` y un enlace violeta pequeño `Cambiar`. **Es lo que cierra el círculo entre lo que se oye y lo que se ve.**

**Columna central** — marco de previsualización vertical 9:16 grande y en vivo: el avatar encuadrado de pecho hacia arriba sobre fondo con gradiente oscuro, subtítulos karaoke en español resaltados en amarillo en el tercio inferior, marca de agua del logo en la esquina superior derecha y una barra fina de marca en el lower-third. Debajo, la nota `Vista previa en vivo`.

**Columna derecha (320 px)** — panel `Marca` con desplegable `Kit: Diego Innovación`, y secciones:

- `Colores`: tres muestras etiquetadas `Primario`, `Secundario`, `Acento` más una muestra `+`
- `Logo`: mosaico oscuro con la marca y selector de posición con cuatro iconos de esquina, activo el superior derecho
- `Subtítulos`: tres chips de previsualización `Karaoke`, `Bloque`, `Pop` — `Karaoke` seleccionado — más una muestra de color de resalte amarillo
- `Tipografía`: desplegable `Inter Semibold`

**Debajo de las tres columnas, a todo el ancho** — panel `Recursos` con subtítulo `Sube imágenes o videos. Los colocamos donde mejor encajen.`:

- Zona de arrastre punteada a la izquierda: `Arrastra imágenes o videos` con subetiqueta `o busca en tu equipo`
- A su derecha, cuatro **tarjetas de recurso**: dos fotos, una imagen de gráfico, y un clip de video con insignia de play y duración `0:06`. Cada una con "x" en la esquina y, **debajo de la miniatura**, un pill violeta de sugerencia con icono de destello:
  ```
  Sugerido para: Gancho — 00:00
  Sugerido para: Dato — 00:15
  Sugerido para: Apoyo — 00:28
  Sin asignar                     ← este pill en gris
  ```
- Al extremo derecho, separador vertical y un bloque compacto con destello, la etiqueta `Escenas sin recurso: 2` y un botón fantasma violeta `Generar con IA`

**Abajo a la derecha:** botón violeta `Continuar a Escenas →`

---

### Pantalla 7 · Escenas — `/create/[id]/escenas` — stepper paso 6

**Rol:** última revisión antes de gastar créditos. Punto de aprobación.

**Título:** `Revisa tus escenas` · **Subtítulo:** `6 escenas · 0:50 · 1080x1920 · Plantilla Informativo`

**Área principal** — fila horizontal de seis frames verticales 9:16 de storyboard. Cada uno con etiqueta debajo y, en la esquina superior izquierda, una insignia diminuta `Subido` (gris) o `Generado` (violeta con destello):

```
00:00 Gancho — motion completo        Generado
00:08 Avatar + subtítulos             Subido
00:16 Dato — motion completo          Generado
00:24 Avatar + imagen de apoyo        Subido
00:35 Comparativa — motion            Generado
00:43 Cierre + CTA                    Generado
```

Contenido de cada frame: (1) tarjeta de título a sangre con tipografía cinética grande sobre gradiente violeta-naranja y formas geométricas; (2) el avatar con subtítulos karaoke y barra de marca; (3) tarjeta de estadística con número enorme y gráfico; (4) el avatar con un recorte de foto flotando al lado; (5) tarjeta comparativa a dos columnas con iconos; (6) tarjeta final con logo, CTA de seguir y flecha animada.

Cada frame lleva un icono fantasma de flecha circular abajo a la derecha para regenerar, y una marca fina violeta en el borde superior indicando un beat.

**Debajo** — editor de timeline **multipista** a todo el ancho, con regla de tiempo `0:00–0:50`, cabezal violeta en `0:16` y **guías verticales punteadas cada 8 segundos**. Pistas, de arriba abajo:

| Etiqueta | Contenido |
|---|---|
| `SUBTÍTULOS` | tira densa de marcas diminutas por palabra |
| `MOTION GRAPHICS` | bloques naranjas, claramente **por encima**, con marcadores de transición entre ellos |
| `RECURSOS` | bloques gris azulado con miniaturas diminutas |
| `AVATAR` | bloques violeta oscuro con huecos, **e icono de candado** junto a la etiqueta |
| `MÚSICA` | dos bloques verdes contiguos con una **X de crossfade** donde se cruzan: el primero `Épico inspiracional`, el segundo `Corporate loop`, más un icono de altavoz |
| `VOZ` | tira fina de forma de onda, **con candado** |

Leyenda apagada bajo el timeline: `Cambio visual cada 8 s · La música baja bajo la voz`

**Panel derecho (300 px)** — `Resumen` con filas etiqueta/valor: `Plantilla`, `Nicho`, `Avatar`, `Voz`, `Marca`, `Música`, `Formato`, `Créditos estimados 14`. Debajo, botón violeta a todo el ancho `Generar video` con la nota `Recibirás el MP4 y el proyecto abierto en el editor.`

---

### Pantalla 8 · Generando — `/create/[id]/generando`

**Rol:** acompañar una espera **larga**. No es un spinner de segundos.

⚠ **Dato real medido: el proceso completo tarda entre 8 y 9 minutos.** Diseña para eso.

```
   ✓  Analizando tus fuentes            12 s
   ✓  Escribiendo el guion               8 s
   ✓  Generando la voz                   8 s
   ✓  Generando las imágenes            41 s
   ◐  Generando el avatar          3 m 29 s   ← en curso, con barra propia
   ○  Componiendo el video
   ─────────────────────────────────────────
   Tiempo estimado restante: 5 min
```

Requisitos:

- **Estimación en minutos, visible y actualizándose.** Nunca un spinner sin número
- Mensaje explícito: `Puedes cerrar esta pestaña. Te avisamos cuando esté listo.`
- El paso en curso lleva su **propia barra de progreso**, no solo un check pendiente
- `Componiendo el video` es el paso más largo (~5 min): dale peso visual
- Fallo → cruz roja, mensaje llano, y **`Se te devolvieron 14 créditos`** bien visible + botón `Volver a intentar`

---

### Pantalla 9 · Video listo — `/create/[id]/listo`

**Dos entregas, no una.**

```
┌───────────────────────┬─────────────────────────────┐
│                       │  Tu video está listo        │
│      ┌─────────┐      │  0:50 · 1080x1920 · 33,7 MB │
│      │  9:16   │      │                             │
│      │ player  │      │  [ ⬇ Descargar MP4 ]        │
│      │         │      │  [ ✎ Abrir en el editor ]   │
│      └─────────┘      │  [ ⧉ Duplicar proyecto ]    │
│                       │                             │
│                       │  Se usaron 14 créditos      │
└───────────────────────┴─────────────────────────────┘
```

Nota bajo los botones: `En el editor puedes ajustar el motion graphics, los subtítulos y la música.`

---

### Pantalla 10 · Centro de integraciones — `/integrations`

**Rol:** conectar cuentas. Es donde se pierden usuarios si está mal resuelto.

```
┌───────────────────────────────────────────────────────┐
│ Integraciones                                         │
│ Conecta tus cuentas para generar videos.              │
├───────────────────────────────────────────────────────┤
│ ElevenLabs      ● Conectado    ••••4f2a               │
│ Genera la voz de tus videos    Verificado hace 2 h    │
│  ├ ● Cuenta              4 voces · 2 clonadas         │
│  └ ● Vinculada con HeyGen    Sí · 2 voces visibles    │
│                               [Verificar][Desconectar]│
├───────────────────────────────────────────────────────┤
│ HeyGen          ● Conectado    ••••9b71               │
│ Genera el avatar que habla     Verificado hace 2 h    │
│ 8 avatares · Avatar III        Créditos: 1.240        │
│                               [Verificar][Desconectar]│
├───────────────────────────────────────────────────────┤
│ OpenAI          ● Sin conectar                        │
│ Genera las imágenes de tus escenas       [ Conectar ] │
├───────────────────────────────────────────────────────┤
│ Instagram       ● Sin conectar                        │
│ Métricas de tus publicaciones            [ Conectar ] │
├───────────────────────────────────────────────────────┤
│ Apify           ● Sin conectar          Opcional      │
│ Analiza enlaces de TikTok e Instagram    [ Conectar ] │
└───────────────────────────────────────────────────────┘
```

**Reglas que el diseño debe reflejar:**

- La clave **nunca se muestra**: solo `••••` + últimos 4
- Cada tarjeta dice **para qué sirve** en lenguaje de usuario, no de API
- **No hay selector de modelo de avatar.** `Avatar III` se muestra como dato, no como control
- Las opcionales van marcadas como tales
- Enlace de ayuda por proveedor: `¿Dónde encuentro mi clave?`

**Estados de error que hay que diseñar** — son reales y frecuentes:

| Estado | Cómo se ve |
|---|---|
| Falta un permiso | Punto rojo + **`Falta el permiso text_to_speech`** con el nombre exacto |
| Sin créditos en el proveedor | Punto ámbar + `Sin créditos en HeyGen` + enlace para recargar |
| Clave inválida | Punto rojo + `Clave inválida` |
| Sin verificar | Punto gris + `Sin verificar` |

**Modo guiado de vinculación** — cuando ElevenLabs necesita conectarse dentro de HeyGen, se despliega **dentro de nuestra app**, nunca un "ve a HeyGen y configúralo":

```
┌──────────────────────────────────────────────────────┐
│ Vincular tu voz con HeyGen                    Paso 1/3│
│                                                       │
│ Para que tus voces clonadas aparezcan en HeyGen,     │
│ hay que pegar tu clave allí una sola vez.            │
│                                                       │
│  1  [ Copiar mi clave ]        ✓ Copiada             │
│  2  [ Abrir HeyGen ↗ ]         se abre en otra pestaña│
│  3  [ Ya lo hice, comprobar ]                        │
│                                                       │
│ Esto se hace una vez, no por cada video.             │
└──────────────────────────────────────────────────────┘
```

---

### Pantalla 11 · Biblioteca — `/library`

Rejilla de videos con filtros `Todos · En proceso · Listos · Fallidos`, búsqueda y filtro por nicho.

Cada tarjeta: miniatura 9:16, título, pill de nicho, duración, fecha y estado. Las que están en proceso muestran barra de progreso y `Generando — paso 5 de 6`. Las fallidas muestran el motivo y botón de reintentar.

**Aquí vive el progreso de generación, no en el dashboard.**

Vacío: *"Todavía no has creado ningún video"* + *"Tu primer video toma menos de 10 minutos."* + botón `Crear mi primer video`.

---

### Pantalla 12 · Perfil, equipo y facturación — `/settings`

Tres pestañas:

| Pestaña | Contenido |
|---|---|
| `Perfil` | Nombre, foto, correo, idioma. Sección **`Mi voz`**: clonar voz con **casilla de consentimiento obligatoria** — *"Confirmo que esta voz es mía o que tengo autorización expresa de su titular para clonarla."* |
| `Equipo` | Miembros y roles (`Propietario`, `Administrador`, `Editor`, `Lector`). Invitar por correo |
| `Facturación` | Plan actual, créditos disponibles, historial del ledger, método de pago, facturas |

El historial de créditos muestra el ledger tal cual: fecha, motivo en español (`Compra`, `Reserva`, `Consumo`, `Devolución`), proyecto asociado y saldo resultante.

---

### Pantalla 13 · Detalle de publicación — `/library/publicaciones/[id]`

Métricas de un post concreto: curva de crecimiento en el tiempo, comparación con la media del workspace, y —lo importante— **el proyecto que lo generó**, con botón para duplicarlo.

Es donde se cierra el ciclo: *este gancho, este nicho y esta plantilla dieron este resultado.*

---

## 6. Responsive

| Ancho | Comportamiento |
|---|---|
| ≥ 1280 px | Layout completo: sidebar + contenido + panel derecho |
| 1024–1279 px | El panel derecho colapsa a pestaña |
| 768–1023 px | El sidebar colapsa a iconos; las columnas se apilan |
| < 768 px | **Solo consulta**: dashboard, biblioteca y ver un video. El wizard muestra *"Crea tus videos desde una pantalla más grande"* |

**El wizard es una herramienta de escritorio a propósito.** Elegir avatar, ajustar branding y revisar un storyboard de 6 frames no funciona en 375 px, y fingir que sí produce peor experiencia que decirlo con claridad.

## 7. Accesibilidad

- Contraste **AA mínimo** sobre `#0B0B10`
- Todo lo interactivo alcanzable por teclado; el wizard avanza con Enter
- Foco visible en violeta, nunca `outline: none` sin reemplazo
- Los estados **nunca se comunican solo por color**: el punto verde/ámbar/rojo siempre va con texto
- `aria-live` en el progreso de generación
- Los previews de audio tienen control de teclado y **no se reproducen automáticamente**

## 8. Qué NO hacer

- ❌ Poner el stepper de 6 pasos en el panel principal
- ❌ Más de un elemento naranja por pantalla
- ❌ Un spinner sin número en la pantalla de generación — la espera son minutos
- ❌ Una tabla vacía como estado vacío
- ❌ Mostrar el error técnico del proveedor al usuario
- ❌ Comunicar un estado solo con color
- ❌ Un selector de modelo de avatar (siempre Avatar III)
- ❌ Controles activos sobre las pistas de Avatar y Voz — van con candado a propósito
- ❌ Texto en inglés en cualquier parte de la interfaz
- ❌ Signos de exclamación
- ❌ Formato numérico anglosajón (`8,420` o `7.3%`)

---

**Fin del prompt.**
