# 01 — Arquitectura · Video AI Studio

> Cómo funciona el sistema por dentro, y por qué está construido así.
> Última actualización: 25 jul 2026

---

## 1. La decisión que define todo

**No construimos un motor de render.** Construimos un **compilador de variables**.

HyperFrames renderiza video desde HTML: el DOM declara el tiempo con `data-start` / `data-duration` / `data-track-index`, y una sola timeline GSAP pausada por composición. Soporta variables tipadas y el patrón **"upload once, re-render many"**:

```
plantilla.zip  →  se sube UNA vez  →  asset_id
                                        │
   cada video del usuario  =  POST { asset_id, variables }
```

Sin re-zip, sin re-upload, sin granja de FFmpeg, sin Chrome headless que mantener.

**Consecuencia:** el producto es *entrada del usuario → JSON de variables → render*. Todo lo que construimos es lo que produce ese JSON. Esto reduce el MVP de ~6 meses a ~6 semanas.

**Consecuencia comercial:** HyperFrames renderiza en la nube gestionada de HeyGen. Avatares y render son **un solo contrato**.

---

## 2. Stack

| Capa | Elección | Por qué esta |
|---|---|---|
| Frontend | **Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui** | Server Actions eliminan la capa de API para el 80 % del CRUD. shadcn da el look oscuro sin pelear con un design system ajeno |
| Backend | **Route Handlers + Server Actions**, mismo repo | Un solo deploy. No hay razón para un backend separado a este tamaño |
| DB + Auth + Storage | **Supabase** (Postgres + RLS + Storage + Realtime) | RLS resuelve el aislamiento multi-tenant **en la base**, no en el código. Realtime empuja el progreso del job al UI sin polling |
| Orquestación | **Inngest** | El pipeline es de 8 pasos, dura minutos y depende de webhooks externos. Necesita *durable steps* con reintentos y reanudación, no un cron ni una cola casera |
| Hosting | **Vercel** | Serverless encaja porque ningún paso corre más de 60 s: todo lo largo se delega y vuelve por webhook |
| Pagos | **Stripe** | Suscripción + ledger de créditos |
| LLM | **Claude** — `claude-sonnet-5` (guiones), `claude-opus-5` (análisis de referencias) | Sonnet 5 da la latencia que el paso 2 necesita; Opus 5 solo donde el razonamiento estructural paga |
| Imágenes | **GPT Image** (OpenAI) | Frames de escena |
| i18n | **next-intl**, locale único `es` | Cero strings en JSX desde el día 1 |
| Secretos | **AES-256-GCM (envelope)** en Postgres, KEK en entorno | BYOK exige que nunca guardemos texto plano |

### Alternativas descartadas

| Descartada | Por qué no |
|---|---|
| Remotion + Lambda propia | Construir y mantener infraestructura de render que HyperFrames ya da gestionada |
| Cola propia sobre Postgres | Reintentos, reanudación y observabilidad son trabajo real. Inngest ya los tiene |
| Backend separado (NestJS/FastAPI) | Dos deploys y dos modelos de auth para un producto que cabe en uno |
| Prisma | El cliente de Supabase con tipos generados basta y no pelea con RLS |
| Firebase | RLS de Postgres es más expresivo que las reglas de Firestore para este modelo |

---

## 3. Diagrama de sistema

```
┌───────────────────────────────────────────────────────────────┐
│  Next.js 15  ·  Vercel                                        │
│  Panel de rendimiento · Wizard 6 pasos · Integraciones        │
│  Brand Kit · Biblioteca · Perfil                              │
└──────────────────┬────────────────────────────────────────────┘
                   │ Server Actions
           ┌───────▼─────────┐        progreso en tiempo real
           │    Supabase     │◄──────────────────────────────┐
           │ Postgres + RLS  │                               │
           │ Storage · Auth  │                               │
           └───────┬─────────┘                               │
                   │ evento: video.generate.requested        │
        ┌──────────▼───────────────────────────────────────┐ │
        │  INNGEST — pipeline durable                      │─┘
        └──┬────┬────┬────┬────┬────┬─────────────────────┘
           │    │    │    │    │    │
           │    │    │    │    │    └──► HyperFrames Cloud (HeyGen)
           │    │    │    │    │           POST /v3/hyperframes/renders
           │    │    │    │    │           asset_id + variables + callback
           │    │    │    │    └───────► HeyGen  (avatar, lip-sync, alpha)
           │    │    │    └────────────► ElevenLabs (audio + tiempos)
           │    │    └─────────────────► GPT Image (frames de escena)
           │    └──────────────────────► Claude (propuestas, guion, análisis)
           └───────────────────────────► Apify (scraping TikTok/IG/YT)

        ┌──────────────────────────────────────────┐
        │  INNGEST — cron cada 6 h                 │──► Meta Graph API
        │  sync de métricas de publicaciones       │    (Instagram insights)
        └──────────────────────────────────────────┘
                                    │
                           webhooks ▼
            /api/webhooks/{heygen|hyperframes|stripe}
```

---

## 4. El pipeline

Cada paso es un `step.run` de Inngest: idempotente, reintentable, reanudable.

> **Modo de voz.** Los pasos 4 y 6 asumen el **Modo A** (nosotros generamos el audio y HeyGen hace lip-sync sobre él). Si la cuenta de HeyGen no acepta audio externo, el pipeline cae automáticamente al **Modo B**: el paso 4 solo selecciona la voz, HeyGen sintetiza contra la cuenta de ElevenLabs del usuario, y se inserta un paso `timing` de transcripción antes de componer. La detección es una sola vez, al conectar HeyGen. Ver [`03-INTEGRATIONS.md`](03-INTEGRATIONS.md) §2b.

| # | Estado | Qué hace | Externo | Duración |
|---|---|---|---|---|
| 0 | `draft` | Usuario elige tipo, escribe su idea, adjunta fuentes | — | — |
| 1 | `ingesting` | Por cada fuente: extraer texto (artículo, PDF, imagen) o scrape + transcribir + analizar estructura. Normaliza a contexto único | Apify, Scribe, Claude | 15–90 s |
| 2 | `ideating` | 3 propuestas de idea | Claude | 8–15 s |
| 3 | `scripting` | Guion en 4 bloques. Usuario edita y **confirma** → `hold` de créditos | Claude | interactivo |
| 4 | `voicing` | **ElevenLabs genera el audio** con la voz clonada + tiempos por palabra. El usuario escucha y aprueba | ElevenLabs | 20–60 s |
| 5 | `styling` | Avatar + look **y** Brand Kit + recursos. Cada archivo subido se analiza y se asigna a un slot | HeyGen, Claude multimodal | interactivo |
| 5b | `visualizing` | Slots vacíos se generan con GPT Image | GPT Image | 20–60 s |
| 6 | `avatar` | **HeyGen genera el avatar hablando ese audio** (lip-sync) con **Avatar III**, fondo transparente | HeyGen | 60–180 s |
| 6b | `timing` | *Solo en Modo B*: se transcribe el audio del video para obtener los tiempos por palabra | Transcripción | 10–25 s |
| 7 | `composing` | Resuelve música, arma el JSON de variables, dispara el render con `callback_url` | HyperFrames Cloud | 60–240 s |
| 8 | `ready` | Webhook → MP4 a Storage **y proyecto abierto en el editor** | — | — |
| — | `failed` | Agota reintentos → **devuelve créditos** y guarda diagnóstico | — | — |

### El orden: guion → audio → avatar → motion graphics

```
   PASO 3           PASO 4              PASO 5           PASO 6
   guion       →    VOZ           →     avatar y    →    escenas
   en texto         (audio)             marca            (aprobar)
                       │                                    │
                       ▼                                    ▼
  ┌────────────────────────────────┐        ┌───────────────────────────┐
  │  ElevenLabs  (API directa)     │        │  HeyGen                    │
  │  voz profesional clonada       │───────►│  el avatar habla ESE audio │
  │  + tiempos de cada palabra     │ audio  │  lip-sync · fondo alpha    │
  └────────────────────────────────┘        └─────────────┬─────────────┘
                       │  tiempos                         │ video
                       └──────────────┬───────────────────┘
                                      ▼
                   ┌──────────────────────────────────────────┐
                   │  HyperFrames                              │
                   │  motion graphics superpuesto, subtítulos, │
                   │  branding, recursos, música, transiciones │
                   └──────────────────┬───────────────────────┘
                                      ▼
                   MP4 9:16  +  proyecto en el editor
```

**Por qué el audio va antes que el avatar:**

1. **Calidad.** Llamando a ElevenLabs directamente, la voz es la de la cuenta del usuario con su voz clonada profesional, sin la degradación de sintetizar a través de un intermediario.
2. **Control.** El audio se escucha y se aprueba *antes* de gastar en el video. Si no convence, se regenera un bloque por céntimos en lugar de rehacer todo.
3. **Los tiempos salen gratis.** ElevenLabs devuelve la alineación por palabra en la misma respuesta. Es exactamente lo que alimenta los subtítulos karaoke — sin transcripción, sin alineación forzada, sin un paso más.

**Frontera de cobro:** los pasos 1–3 son baratos (solo LLM) y se repiten libremente. El gasto real empieza en el paso 4. Por eso el `hold` de créditos se hace al confirmar el guion.

---

## 5. El compilador de variables

La única lógica de negocio verdaderamente propia: `lib/render/compile-variables.ts`

```ts
{
  // branding
  brandPrimary, brandSecondary, brandAccent,
  logoUrl, logoPosition, subtitleStyle, subtitleHighlight, fontFamily,
  // contenido
  hookText, ctaText,
  // pistas de medios
  avatarVideoUrl,   // webm con alpha ← HeyGen (va muted)
  voiceoverUrl,     // mp3 ← ElevenLabs. HyperFrames exige <audio> aparte:
                    // el <video> nunca lleva el sonido
  // música por bloque, libre de derechos
  musicIntroUrl,    // hook + promesa — inspiracional épico
  musicBodyUrl,     // contenido + CTA — corporate loop / tech house
  musicDuckDb,      // -18 por defecto
  // recursos ya resueltos por slot
  slots: [{ id: 'dato-1', url, source: 'upload'|'generated', aspect }],
  // estructura por escena
  scenes: [{ index, start, duration, mode: 'avatar'|'motion'|'mixto',
             block: 'hook'|'promise'|'content'|'cta',
             text, captionCues: [{ w, t0, t1 }],
             beats: [t...],        // cambio visual cada <= 8 s
             slotId?, transition }]
}
```

**Contrato duro:** la plantilla es la dueña del esquema. El compilador se valida contra `data-composition-variables` **antes** de enviar (`--strict-variables`). Si el esquema cambia, la validación falla en CI, no en producción.

---

## 6. Capas de composición

No se "mezclan" el avatar y los gráficos: son capas independientes, apiladas.

```
  pista 4   SUBTÍTULOS      karaoke palabra a palabra, siempre encima
  pista 3   MOTION GRAPHICS superpuesto: tipografía cinética, formas, tarjetas
  pista 2   RECURSOS        imágenes subidas o generadas, B-roll
  pista 1   AVATAR          video de HeyGen con fondo transparente (alpha)
  pista 0   FONDO           ⚠ CAMBIA POR ESCENA — ver abajo
  ─────────────────────────────────────────────────────────────
  pista A   MÚSICA          bed sin copyright, con ducking
  pista B   VOZ             audio de ElevenLabs
```

### La pista de fondo cambia por escena

Es la decisión que hace que el video **no parezca un recorte flotando**:

| Modo de escena | Qué va en la pista 0 | Qué se ve |
|---|---|---|
| `avatar` | **Fondo natural**: gradiente con textura y viñeta, foto de entorno, o desenfoque de marca | El avatar parece grabado en un sitio real, no recortado |
| `motion` | **La animación completa**: tipografía cinética, tarjeta de dato, formas | El avatar queda **superpuesto** sobre el motion graphics |
| `mixto` | Fondo natural + elementos de motion entrando por los lados | Transición entre ambos |

**Un solo render de HeyGen sirve para los tres.** El fondo es una decisión de composición, no de generación.

### Por eso siempre se pide alpha, aunque el fondo se vea "normal"

Un avatar con fondo opaco solo permite el primer modo. Con alpha se obtienen los tres, incluido un fondo que parezca real. **El alpha es estrictamente más flexible**, así que la generación pide `output_format: webm` siempre — incluso cuando el 70 % del video se verá con fondo natural.

✅ Verificado en el Spike 0: recorte limpio, **1,76 % de píxeles de borde semitransparente** a 1080×1920. Apto para superponer sin halo.

### Reglas de HyperFrames que condicionan el diseño

Verificadas contra el contrato del framework:

- **Una sola timeline GSAP pausada** por composición, en `window.__timelines["<id>"]`, construida síncronamente al cargar.
- **El audio va siempre en un `<audio>` aparte**, aunque el archivo sea el mismo que el del `<video>`. El `<video>` va `muted` y `playsinline`.
- **Nunca llamar** `play()`, `pause()` ni `seek()` en el código de la composición. El framework es dueño de la reproducción.
- **Sin relojes de render, sin `Math.random` sin semilla, sin red, sin `repeat: -1`.** El render debe ser determinista.
- **Todo `id` único en la página ensamblada.** Dentro de un sub-composición, prefijar con el id de la composición. Ids duplicados de `<video>`/`<img>` renderizan **en blanco**.
- **El fondo a pantalla completa va en un hijo full-bleed** (`position:absolute; inset:0`), nunca en la raíz de la composición — el compositor puede descartar el `background` de la raíz y el frame sale **negro**.
- **La raíz necesita caja dimensionada** en px, o el contenido colapsa a la esquina superior izquierda.

---

## 7. Ritmo y sincronía

**Regla de 8 segundos:** ningún plano dura más de 8 s sin un cambio visual. En 50 s son 6–7 beats.

La plantilla declara sus beats en `beats_json`. La plataforma los alinea con los **tiempos por palabra** de ElevenLabs, de forma que las transiciones caigan **entre frases y nunca a mitad de una palabra**.

```
palabras:  [Si] [quieres] [automatizar] ... [tu] [negocio]
tiempos:   0.0  0.21      0.68              1.9  2.05
beat ideal:                        8.00
beat real:                         8.14  ← desplazado al siguiente límite de frase
```

Ese desplazamiento es lo que separa un video que se siente profesional de uno que se siente automático.

---

## 8. Seguridad

| Riesgo | Mitigación |
|---|---|
| Claves BYOK en claro | AES-256-GCM con KEK en entorno + `key_version` para rotación. Descifrado solo en el runtime del job |
| Tokens OAuth de Instagram | Mismo cifrado. Refresco automático antes de expirar; revocar borra el token, no solo la fila |
| Fuga entre tenants | RLS en Postgres + `workspace_id` en cada query. **Tests de RLS en CI** |
| Webhooks falsificados | Verificación de firma HMAC antes de parsear |
| Cobro doble | `webhook_events.external_id` UNIQUE + `idempotency_key` en cada llamada saliente que gasta dinero |
| Abuso de créditos | `hold` antes de llamar al proveedor; `refund` automático en `failed` |
| **SSRF vía enlaces del chat** | El chat acepta cualquier URL, la allowlist no basta: se resuelve el DNS y se **bloquean IPs privadas y de metadatos** (169.254.169.254, 10/8, 192.168/16, ::1), sin seguir redirecciones fuera de la política, con timeout y límite de tamaño |
| Archivos subidos maliciosos | Tipo real por *magic bytes* (no por extensión), límites de tamaño/páginas/duración, extracción aislada sin ejecutar JS embebido. Los videos se re-codifican; nunca se sirve el original |
| **Prompt injection desde fuentes adjuntas** | **El riesgo principal.** Un PDF o artículo puede traer instrucciones dirigidas al modelo. Todo lo extraído entra envuelto en delimitadores explícitos y marcado como *dato no confiable*; el system prompt establece que nada dentro de esos delimitadores altera la tarea; la salida va forzada a JSON con esquema estricto y se valida antes de persistir |
| Contenido con derechos de terceros | El usuario declara derechos al subir. La música siempre sale del catálogo libre, nunca de una subida |

---

## 9. Estructura del repositorio

```
video-ai-studio/
├── app/
│   ├── (marketing)/              landing, precios, demo pública
│   ├── (app)/
│   │   ├── dashboard/            panel de rendimiento (Instagram)
│   │   ├── create/[projectId]/
│   │   │   ├── idea/             paso 1
│   │   │   ├── propuestas/       paso 2
│   │   │   ├── guion/            paso 3
│   │   │   ├── voz/              paso 4
│   │   │   ├── avatar/           paso 5
│   │   │   └── escenas/          paso 6
│   │   ├── library/              videos generados, filtro "En proceso"
│   │   ├── brand/                brand kits
│   │   ├── integrations/         centro de gestión de APIs
│   │   ├── templates/            catálogo de plantillas
│   │   └── settings/             perfil · equipo · facturación
│   └── api/
│       ├── inngest/route.ts
│       └── webhooks/{heygen,hyperframes,stripe}/route.ts
├── lib/
│   ├── providers/                clientes tipados + reintentos
│   │   ├── heygen.ts  elevenlabs.ts  hyperframes.ts
│   │   ├── gptimage.ts  apify.ts  claude.ts  meta.ts
│   ├── crypto/vault.ts           envelope encryption
│   ├── render/compile-variables.ts
│   ├── assets/                   análisis y asignación a slots
│   ├── music/resolver.ts         selección por bloque y tipo
│   ├── credits/ledger.ts         hold/commit/refund
│   └── pipeline/                 funciones Inngest
├── messages/es.json              TODOS los strings de la UI
├── templates/                    proyectos HyperFrames versionados
│   ├── informativo-9x16/
│   ├── reaccion-9x16/
│   └── referencia-9x16/
├── supabase/migrations/
└── docs/
```

**Regla de idioma en el código:** el código, las tablas, las columnas, las variables y los commits van **en inglés**. La UI va **en español**. Mezclar idiomas en el código es deuda técnica; mezclarlos en la UI es un producto roto.

---

## 10. Plan de construcción

| Sprint | Entregable | Se demuestra con |
|---|---|---|
| **0** | **Spike de validación (2–3 días, antes de escribir producto).** A mano, con las claves reales: (a) ElevenLabs sintetiza 50 s con la voz clonada → HeyGen genera el avatar **Avatar III** con lip-sync sobre ese audio, alpha → HyperFrames compone → MP4; (b) se comprueba si HeyGen permite registrar la clave de ElevenLabs por API; (c) se anota el consumo real de créditos de Avatar III en 50 s | Un video real hecho a mano, y tres respuestas: acepta audio externo, se puede provisionar la clave por API, y cuánto cuesta de verdad un video |
| 1 | Next.js + Supabase + auth + RLS + `next-intl` + shell | Login → panel vacío, en español, aislado por workspace |
| 2 | Integraciones + vault cifrado + sync de catálogos | Conectar HeyGen/ElevenLabs y ver avatares y voces reales |
| 3 | Wizard 1–3: chat multi-fuente + ingesta + 3 propuestas + motor de CTA + editor de guion | De una idea y 3 adjuntos a un guion de 50 s confirmado |
| 4 | Plantilla "Informativo" con slots, beats de 8 s y capas + catálogo de música + compilador. **Depende de `08-ESTRUCTURA-MOTION.md`** | MP4 desde un JSON de variables a mano |
| 4b | Recursos: subida, análisis, asignación a slots, generación con GPT Image | Subes 3 archivos, se colocan solos, los huecos se generan |
| 5 | Pipeline Inngest completo + webhooks + progreso en vivo + entrega en el editor | Video end-to-end sin intervención |
| 6 | Créditos + Stripe + biblioteca + descarga | Usuario de pago genera y descarga |
| 7 | Panel de rendimiento: OAuth Instagram, cron 6 h, KPIs, gráfico, publicaciones | El creador ve métricas reales y cuál rindió mejor |

---

## 11. Verificación

- **Plantillas:** `npx hyperframes check` (0 hallazgos) → `npx hyperframes snapshot --at <midpoints>` → `npx hyperframes cloud render --dry-run --json` antes de subir
- **Variables:** render con `--strict-variables` en CI; el compilador se testea contra el esquema declarado de cada plantilla
- **RLS:** suite que intenta leer datos de otro workspace y **debe fallar**
- **Idempotencia:** reenviar el mismo webhook dos veces no duplica créditos ni assets
- **Pipeline:** job de prueba con proveedores mockeados corre los 8 pasos; un fallo forzado en el paso 6 **debe devolver los créditos**
- **Aceptación real:** una persona no técnica genera su primer video sin ayuda en **menos de 8 minutos**

---

## 11-bis. Medido en el Spike 0 (jul 2026)

Todo esto son **números reales**, no estimaciones. Un video completo generado con las claves del creador.

| Qué | Medido | Lo que estimábamos |
|---|---|---|
| **Fondo transparente (matting)** | ✅ **Confirmado.** 50,2 % de píxeles con alpha 0, 48,2 % semitransparentes en bordes | Incógnita que podía cambiar el diseño |
| Síntesis de voz (ElevenLabs, ~48 s) | **8 s** | 20–60 s |
| **Render del avatar (HeyGen, Avatar III)** | **209 s** para 47,5 s de video | 60–180 s |
| Tamaño del webm con alpha | **37,6 MB** para 47,5 s | — |
| Sincronía audio ↔ video | 47,51 s vs 47,52 s | — |
| Ritmo de habla | **13,2 caracteres/s** (estable) | 2,6 palabras/s (inestable, ±18 %) |

**Tres consecuencias directas:**

1. **El render tarda ~4,4× el tiempo del video.** Mi estimación se quedaba corta. La pantalla de progreso debe mostrar una estimación honesta (~3,5 min para 50 s), no un spinner sin número.
2. **37,6 MB por avatar de 50 s** es mucho más de lo previsto para una pista intermedia. Con webm+alpha el peso es inevitable, así que el archivo del avatar se borra de Storage **tras componer**: no se conserva, se puede regenerar. Solo se guarda el MP4 final.
3. **La estimación de duración va por caracteres**, no por palabras. Ver [`07-METODOLOGIA-GUION.md`](07-METODOLOGIA-GUION.md).

### El detalle técnico del alpha que hay que saber

El webm de HeyGen trae `alpha_mode: 1` en el contenedor, pero **`ffprobe` reporta `pix_fmt=yuv420p`** y un decodificador por defecto devuelve el fondo en **negro opaco**. El alpha de VP9 en WebM viaja en datos laterales (`BlockAdditional`) y solo aparece forzando el decodificador:

```bash
ffmpeg -vcodec libvpx-vp9 -i avatar.webm ...
```

**Si un frame sale con fondo negro, revisa el decodificador antes de concluir que no hay matting.** Se perdió tiempo en el spike por esto, y HyperFrames debe recibir el asset por una ruta que preserve el canal alpha.

## 12. Supuestos a confirmar

1. **(Sprint 0, antes de todo)** HeyGen acepta **audio externo** como fuente de voz del avatar. Verificar el nombre exacto del campo, el plan requerido y la calidad del lip-sync con un audio real de ElevenLabs. **Esto ya no es bloqueante**: si falla, el Modo B (clave de ElevenLabs vinculada a HeyGen, provisionada desde nuestra app) cubre el caso sin rediseñar nada. Ver [`03-INTEGRATIONS.md`](03-INTEGRATIONS.md) §2b.
1b. **Provisión de la clave de ElevenLabs en HeyGen por API.** Desconocido: si HeyGen expone un endpoint para registrarla. Si no lo hace, el modo guiado dentro de nuestra app (copiar clave → abrir HeyGen → comprobar) cubre el caso. Encapsulado en `heygen.ts#provisionVoiceProvider()`.
1c. **Nombre exacto del parámetro de Avatar III** en la API. La decisión de producto —un solo modelo, fijo, sin selector— no depende de esto.
2. Salida de avatar con **fondo transparente** (webm alpha) — verificar disponibilidad por tier. Plan B: fondo de color plano + chroma key, o avatar en marco compuesto.
3. Cuotas y latencia real del render en la nube bajo carga concurrente.
4. TOS de scraping por plataforma — Apify como intermediario y **se replica estructura, nunca contenido**.
5. **Métricas de Instagram (mayor riesgo de calendario):** la Graph API exige cuenta *Instagram Professional* y, según el flujo, vinculada a una Página de Facebook. Los permisos de insights requieren **App Review de Meta**, que tarda días o semanas. Arrancar el sprint 7 en modo desarrollo y enviar a revisión **en paralelo**. Plan B: Windsor.ai.
6. El identificador exacto del modelo de GPT Image se fija al implementar, contra la documentación vigente de OpenAI.
