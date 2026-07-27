# 04 — Flujos UX · Video AI Studio

> Las 13 pantallas, sus estados y cómo se navega entre ellas.
> Última actualización: 25 jul 2026

---

## 1. Dos zonas que no se mezclan

| Zona | Pantallas | Responde |
|---|---|---|
| **Análisis** | 1, 11, 13 | *¿Cómo va mi contenido?* |
| **Creación** | 2–9 | *¿Cómo hago el siguiente?* |
| **Configuración** | 10, 12 | *¿Cómo está montado esto?* |

**El stepper de 6 pasos pertenece exclusivamente a la zona de creación y nunca aparece en el panel principal.** El panel es de rendimiento, no de creación; su único elemento de creación es el botón "+ Crear video".

---

## 2. Mapa de navegación

```
                        ┌──────────────────┐
                        │  1 · Inicio      │  panel de rendimiento
                        │  (Instagram)     │  ← sin stepper
                        └────────┬─────────┘
                                 │ "+ Crear video"
                                 ▼
   ╔═════════════════ WIZARD (stepper de 6 pasos) ═════════════════╗
   ║  2 Idea → 3 Propuestas → 4 Guion → 5 Voz → 6 Avatar y marca   ║
   ║                                          → 7 Escenas          ║
   ╚═══════════════════════════┬═══════════════════════════════════╝
                               ▼
                     ┌──────────────────┐
                     │  8 · Generando   │  progreso de 8 pasos
                     └────────┬─────────┘
                              ▼
                     ┌──────────────────┐
                     │  9 · Listo       │  MP4 + abrir en el editor
                     └────────┬─────────┘
                              ▼
        ┌─────────────────────┴────────────────────┐
        ▼                                          ▼
  ┌───────────────┐                        ┌──────────────┐
  │ 11 Biblioteca │                        │ 13 Detalle   │
  │ (En proceso)  │                        │ publicación  │
  └───────────────┘                        └──────────────┘

  Laterales, accesibles siempre desde el sidebar:
  10 · Integraciones     12 · Perfil, equipo y facturación
  Brand Kit              Plantillas
```

### Sidebar (232 px, fijo)

```
  Video AI Studio
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
  ▓▓▓▓▓▓░░░░
  ─────────────────
  Plan Premium
  [ Mejorar plan ]
```

---

## 3. Las 13 pantallas

| # | Ruta | Pantalla | Stepper |
|---|---|---|---|
| 1 | `/dashboard` | Panel de rendimiento | ✗ |
| 2 | `/create/[id]/idea` | Wizard 1 — Idea | 1 |
| 3 | `/create/[id]/propuestas` | Wizard 2 — Propuestas | 2 |
| 4 | `/create/[id]/guion` | Wizard 3 — Guion | 3 |
| 5 | `/create/[id]/voz` | Wizard 4 — Voz | 4 |
| 6 | `/create/[id]/avatar` | Wizard 5 — Avatar y marca | 5 |
| 7 | `/create/[id]/escenas` | Wizard 6 — Escenas | 6 |
| 8 | `/create/[id]/generando` | Progreso | ✗ |
| 9 | `/create/[id]/listo` | Video listo | ✗ |
| 10 | `/integrations` | Centro de integraciones | ✗ |
| 11 | `/library` | Biblioteca | ✗ |
| 12 | `/settings` | Perfil · Equipo · Facturación | ✗ |
| 13 | `/library/publicaciones/[id]` | Detalle de publicación | ✗ |

**El estado del wizard vive en la base de datos, no en el cliente.** El usuario puede cerrar el navegador y volver a `/create/[id]` — se le redirige a `projects.current_step`.

---

## 4. Pantalla 1 — Panel de rendimiento

**Rol:** responder "¿cómo va mi contenido?" en 5 segundos.

```
┌────────────────────────────────────────────────────────────────┐
│ Rendimiento                    @diegoinnovacion ● Últimos 30 d │
│ Tus publicaciones en Instagram        [ + Crear video ]        │
├────────────────────────────────────────────────────────────────┤
│ Reproducciones  Interacciones  Alcance  Nuevos seg.  Tasa int. │
│    842.100         61.480      512.300     4.920       7,3 %   │
│    +18,4 %         +12,1 %     +9,7 %     +24,3 %     -1,2 %   │
├────────────────────────────────────────────────────────────────┤
│ Evolución                                                      │
│   ╱╲    ╱╲                                                     │
│  ╱  ╲__╱  ╲___╱╲___                                            │
├──────────────────────────────┬─────────────────────────────────┤
│ Publicaciones                │ Mejor rendimiento               │
│ [Todas][Reels][Carruseles]   │  ┌────────┐                     │
│ ▪ miniatura · título · pill  │  │ 9:16   │  11,2 %             │
│   18 jul · 128.400 · 9.240   │  └────────┘                     │
│   · 412 · 1.830        [Top] │  Cuentas conectadas             │
│ ▪ ...                        │  Instagram ● Conectado          │
│ ▪ ...                        │  TikTok    ● Sin conectar       │
└──────────────────────────────┴─────────────────────────────────┘
```

### Estados

| Estado | Qué se ve |
|---|---|
| **Sin Instagram conectado** | Ilustración + "Conecta tu Instagram para ver cómo rinde tu contenido" + botón. Los KPIs no se muestran en gris: **no se muestran** |
| **Conectado, sin publicaciones** | "Todavía no hay publicaciones. Cuando publiques tu primer video, sus métricas aparecen aquí." |
| **Sincronizando** | KPIs con skeleton, aviso "Actualizando métricas..." |
| **Error de sincronización** | Últimos datos + aviso ámbar "Última actualización: hace 14 h" |

---

## 5. Pantalla 2 — Idea (paso 1)

**Rol:** capturar el tipo y la idea, con todo el material que el usuario tenga.

```
┌────────── 1 Idea ─ 2 Propuestas ─ 3 Guion ─ 4 Voz ─ 5 Avatar ─ 6 Escenas ──┐
│                    ¿Qué quieres contar hoy?                                │
│        Elige el formato, escribe tu idea y adjunta lo que tengas.          │
│                                                                            │
│   ┌────────────┐  ┌────────────┐  ┌──────────────────┐                    │
│   │Informativo✓│  │  Reacción  │  │ Desde un enlace  │                    │
│   └────────────┘  └────────────┘  └──────────────────┘                    │
│                                                                            │
│   ┌────────────────────────────────────────────────────────────────┐      │
│   │  Escribe tu idea...                                            │      │
│   │                                                                │      │
│   │  [📄 informe-ia-2026.pdf ×] [🔗 elpais.com/... ×] [📷 reel ×]  │      │
│   │  📎 🔗 🖼 🎤                              3 fuentes    [ ↑ ]   │      │
│   └────────────────────────────────────────────────────────────────┘      │
│                                                                            │
│   Nicho   (Finanzas)(IA y Tecnología✦)(Salud)(Fitness)(Marketing)...      │
│                                       ✦ Detectado automáticamente          │
│                                                                            │
│                               [ Generar ideas → ]                          │
│                               Gratis · no consume créditos                 │
└────────────────────────────────────────────────────────────────────────────┘
```

### Comportamiento

- **Entrada única.** Una pasada, sin repreguntas. Si falta contexto, se asume y la asunción se muestra en las propuestas.
- El nicho se **infiere** del contexto y aparece preseleccionado con la etiqueta "Detectado automáticamente". El usuario puede cambiarlo.
- Cada adjunto muestra su estado: procesando (spinner), listo (check), fallido (×  rojo con motivo).
- Si "Desde un enlace" está seleccionado, el enlace es **obligatorio** y el botón queda inhabilitado sin él.

### Estados

| Estado | Qué se ve |
|---|---|
| Vacío | Placeholder con ejemplo real, no lorem |
| Procesando adjunto | Chip con spinner, botón inhabilitado |
| Adjunto fallido | Chip rojo + "No pudimos leer este archivo" + opción de quitarlo |
| Demasiado contexto | Aviso: "Mucho material. Resumiremos las fuentes más largas." |

---

## 6. Pantalla 3 — Propuestas (paso 2)

**Rol:** elegir qué historia contar. **Es una de las dos decisiones reales del flujo.**

Tres tarjetas comparables, cada una con la misma estructura:

```
┌─────────────────────────┐
│ Reacción informativa (91)│  ← enfoque + medidor de viralidad
│                          │
│ GANCHO                   │
│ Titular en dos líneas    │
│                          │
│ LA IDEA                  │
│ Tres líneas de qué trata │
│                          │
│ 💡 POR QUÉ FUNCIONA      │
│ Dos líneas de razón      │
│                          │
│ ┌──────────────────────┐ │
│ │ CTA SUGERIDO  [Leads]│ │  ← bloque con fondo distinto
│ │ "Comenta [IA] y te   │ │
│ │  envío el sistema"   │ │
│ └──────────────────────┘ │
│ 🕐 50 s  ≈ 128 palabras  │
└─────────────────────────┘
```

- Los 3 enfoques cubren **ángulos distintos del mismo material**, no 3 versiones de lo mismo.
- La seleccionada tiene borde violeta y glow; las otras bajan a 70 % de opacidad.
- "Generar otras 3" es gratis y no pierde las anteriores (se guardan con `index` incremental).

---

## 7. Pantalla 4 — Guion (paso 3)

**Rol:** dejar el texto exacto. **Es la segunda decisión real, y el punto de no retorno.**

```
┌───────────────────────────────────────────┬─────────────────────┐
│ Tu guion   50 segundos · 4 bloques        │ Duración            │
│                                           │      0:50           │
│ ┃ HOOK        0:00 – 0:03                 │ ▓▓░░░░░░░░▓▓        │
│ ┃ Una línea contundente                   │ ✓ Dentro del objetivo│
│                                           ├─────────────────────┤
│ ┃ PROMESA     0:03 – 0:08                 │ Métricas            │
│ ┃ Dos líneas                              │ Palabras      128   │
│                                           │ Ritmo   2,39 pal/s  │
│ ┃ CONTENIDO   0:08 – 0:43                 │ Legibilidad   Alta  │
│ ┃ 1. ...                                  ├─────────────────────┤
│ ┃ 2. ...  ▁▁▁▁▁▁ ← selección              │ Asistente           │
│ ┃    [Acortar][Más directo][Subir         │ 💬 sugerencia [Aplicar]│
│ ┃     tensión][Reescribir][✦ IA]          │ 💬 sugerencia [Aplicar]│
│ ┃ 3. ...                                  ├─────────────────────┤
│                                           │ Versiones           │
│ ┃ CTA FINAL   0:43 – 0:50                 │ ● v3 · ahora        │
│ ┃ Comenta [IA] y te envío...              │   v2 · hace 4 min   │
│                                           │   v1 · original     │
├───────────────────────────────────────────┴─────────────────────┤
│ [Volver a las ideas]              [ Confirmar guion → ]         │
│                              A partir de aquí se usan créditos   │
└─────────────────────────────────────────────────────────────────┘
```

### Comportamiento

- Cada bloque tiene borde de color y su rango de tiempo. Los colores se mantienen en toda la app: **hook violeta, promesa azul, contenido verde, CTA naranja**.
- La barra de duración se actualiza al escribir. Si se pasa de 50 s ±10 %, se pone ámbar con "Va largo: ~58 s".
- Las acciones de IA operan **sobre la selección**, no sobre todo el guion.
- Cada edición asistida crea una versión. Se puede volver atrás.
- **Confirmar hace el `hold` de créditos.** El aviso bajo el botón lo dice explícitamente.

---

## 8. Pantalla 5 — Voz (paso 4)

**Rol:** que el usuario entienda, sin que nadie se lo explique, que *este es el audio exacto que dirá su avatar*.

```
┌────────────────────────────────────┬──────────────────────────┐
│ Voz                                │ Audio del guion          │
│ La voz que hablará tu avatar       │                          │
│                                    │ [ Generar audio ]        │
│ 🔍 Buscar voz...      [ElevenLabs] │                          │
│                                    │ ▶ ~~~~~~~~~~~~~~~~~~     │
│ MIS VOCES                          │   0:18 / 0:50            │
│ ▶ Voz Profesional — Diego [Clonada]│                          │
│   ~~~~~~~ 0:03              ✓      │ ● Hook       0:03  ▶ ↻   │
│ ▶ Voz Casual — Diego     [Clonada] │ ● Promesa    0:05  ▶ ↻   │
│                                    │ ● Contenido  0:35  ▶ ↻   │
│ BIBLIOTECA                         │ ● CTA final  0:07  ▶ ↻   │
│ ▶ Nombre  (Segura)(Cálida)         │                          │
│ ▶ Nombre  (Narración)              │ Escucha antes de generar │
│ ▶ Nombre  (Cálida)                 │ el video. Regenerar un   │
│                                    │ bloque es barato.        │
│ Ajustes de voz                     │                          │
│ [Natural][Enérgico][Narración] ⌄Av.│                          │
├────────────────────────────────────┴──────────────────────────┤
│ [Volver al guion]                    [ Continuar a Avatar → ] │
└───────────────────────────────────────────────────────────────┘
```

### Por qué este paso va antes del avatar

1. **El avatar necesita el audio para existir** — HeyGen hace lip-sync sobre ese archivo.
2. **Control del usuario** — escuchar antes de gastar en el video. Corregir aquí cuesta segundos; corregir después cuesta un video entero.
3. **Los tiempos por palabra salen gratis** — ElevenLabs los devuelve con el audio, y alimentan los subtítulos karaoke.

### Estados

| Estado | Qué se ve |
|---|---|
| Sin ElevenLabs conectado | Panel bloqueado + "Conecta tu cuenta de ElevenLabs" + enlace a Integraciones |
| Sin voces clonadas | Grupo "Mis voces" con "Todavía no tienes voces propias. [Clonar mi voz]" |
| Generando | Barra de progreso por bloque, botón inhabilitado |
| Un bloque falló | Ese bloque en rojo con ↻; los demás intactos |

---

## 9. Pantalla 6 — Avatar y marca (paso 5)

**Rol:** una sola pregunta — "cómo se ve mi video". Look y branding no se separan.

```
┌──────────────┬───────────────────────┬──────────────────────┐
│ Avatar       │                       │ Marca                │
│ [HeyGen]     │    ┌───────────┐      │ Kit: Diego Innov. ⌄  │
│ ▪▪  ▪▪       │    │           │      │                      │
│ ▪▪  ▪✓       │    │   9:16    │      │ Colores              │
│ ▪▪  ▪▪       │    │  preview  │      │ ■ Primario           │
│              │    │           │      │ ■ Secundario         │
│ Looks        │    │  SUBTÍTULO│      │ ■ Acento         [+] │
│ ▫ ▪ ▫ ▫      │    └───────────┘      │                      │
│              │  Vista previa en vivo │ Logo    ▫ ┌┐┌┐┌┐┌┐   │
│ 🔊 Hablará   │                       │                      │
│ con: Voz     │                       │ Subtítulos           │
│ Profesional  │                       │ [Karaoke][Bloque][Pop]│
│ — Diego      │                       │ Resalte  ■           │
│      Cambiar │                       │                      │
│              │                       │ Tipografía           │
│              │                       │ Inter Semibold ⌄     │
├──────────────┴───────────────────────┴──────────────────────┤
│ Recursos    Sube imágenes o videos. Los colocamos donde     │
│             mejor encajen.                                   │
│ ┌─────────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐  │ ✦ Escenas sin  │
│ │Arrastra │ │ ▪  │ │ ▪  │ │ ▪  │ │ ▪  │  │   recurso: 2   │
│ │imágenes │ │────│ │────│ │────│ │────│  │ [Generar con IA]│
│ │o videos │ │Suge│ │Suge│ │Suge│ │ Sin│  │                │
│ └─────────┘ │Ganc│ │Dato│ │Apoy│ │asig│  │                │
│             └────┘ └────┘ └────┘ └────┘  │                │
├─────────────────────────────────────────────────────────────┤
│                              [ Continuar a Escenas → ]      │
└─────────────────────────────────────────────────────────────┘
```

### Asignación automática de recursos

1. Se analiza el archivo (qué muestra, colores, si trae texto)
2. Se compara con los **slots** que declara la plantilla
3. Aparece colocado con su explicación: *"Sugerido para: Dato — 00:15"*
4. Se normaliza al aspecto del slot

**La IA propone, el usuario manda.** Se puede arrastrar a otro slot o desasignar. Los slots sin recurso se generan con IA o caen a motion graphics puro — nunca queda un hueco.

### El recordatorio de voz

Bajo el selector de avatar, una línea fija y no editable: *"Hablará con: Voz Profesional — Diego"* con enlace "Cambiar" al paso 4. Es lo que cierra el círculo entre lo que se oye y lo que se ve.

---

## 10. Pantalla 7 — Escenas (paso 6)

**Rol:** última revisión antes de gastar. Punto de aprobación.

```
┌─────────────────────────────────────────────┬──────────────────┐
│ Revisa tus escenas                          │ Resumen          │
│ 6 escenas · 0:50 · 1080x1920 · Informativo  │ Plantilla  ...   │
│                                             │ Nicho      ...   │
│ ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐        │ Avatar     ...   │
│ │Gen ││Sub ││Gen ││Sub ││Gen ││Gen │        │ Voz        ...   │
│ │9:16││9:16││9:16││9:16││9:16││9:16│        │ Marca      ...   │
│ │  ↻ ││  ↻ ││  ↻ ││  ↻ ││  ↻ ││  ↻ │        │ Música     ...   │
│ └────┘└────┘└────┘└────┘└────┘└────┘        │ Formato    9:16  │
│ 00:00  00:08  00:16  00:24  00:35  00:43    │ Créditos    14   │
│ Gancho Avatar Dato  Avatar Compar Cierre    │                  │
│                                             │ [Generar video]  │
├─────────────────────────────────────────────┤                  │
│ 0:00     0:08    0:16    0:24   ...   0:50  │ Recibirás el MP4 │
│  ┊        ┊       ┊       ┊            ┊    │ y el proyecto    │
│ SUBTÍTULOS ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪      │ abierto en el    │
│ MOTION GR. ▓▓▓▓  ▓▓▓▓▓  ▓▓▓  ▓▓▓▓▓▓         │ editor.          │
│ RECURSOS      ▪▪▪▪   ▪▪▪▪                   │                  │
│ AVATAR 🔒  ▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓             │                  │
│ MÚSICA     ▓▓▓▓╳▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 🔊          │                  │
│ VOZ    🔒  ~~~~~~~~~~~~~~~~~~~~~~           │                  │
│                                             │                  │
│ Cambio visual cada 8 s · La música baja bajo la voz            │
└───────────────────────────────────────────────────────────────┘
```

- Cada frame lleva una insignia: **"Subido"** (gris) o **"Generado"** (violeta con ✦), y un botón de regenerar.
- Las guías verticales punteadas marcan los **beats cada 8 segundos**.
- La pista de música muestra los **dos temas** y la **X del crossfade** donde se cruzan.
- **AVATAR y VOZ llevan candado**: se muestran pero no se editan. Cambiarlas exige volver al paso 4.

---

## 11. Pantalla 8 — Generando

```
   ✓  Analizando tus fuentes            12 s
   ✓  Escribiendo el guion               8 s
   ✓  Generando la voz                   8 s
   ✓  Generando las imágenes            41 s
   ◐  Generando el avatar          3 m 29 s   ← en curso
   ○  Componiendo el video
   ─────────────────────────────────────────
   Tiempo estimado restante: 5 min
```

⚠ **Tiempos reales medidos en el Spike 0**, no estimados:

| Paso | Real |
|---|---|
| Voz (ElevenLabs, 48 s de audio) | **8 s** |
| Avatar (HeyGen, Avatar III) | **209 s** |
| Composición (HyperFrames, 1080×1920) | **286 s** |
| **Total realista** | **~8–9 min** |

Esto **cambia el diseño de la pantalla**: no es una espera de segundos con un spinner, son casi diez minutos. Por eso:

- Estimación en minutos, visible y actualizada — nunca un spinner sin número
- Mensaje explícito de que **puede cerrar la pestaña**
- Notificación al terminar
- El paso "Componiendo el video" es el más largo: merece su propia barra de progreso, no solo un check pendiente

- Progreso empujado por **Supabase Realtime**, sin polling.
- El usuario **puede cerrar la pestaña**. Se le avisa por notificación al terminar.
- Si un paso falla: cruz roja, mensaje en lenguaje llano, y **"Se te devolvieron 14 créditos"**.
- Tiempo estimado restante, calculado con la media histórica del workspace.

---

## 12. Pantalla 9 — Video listo

```
┌───────────────────────┬─────────────────────────────┐
│                       │  Tu video está listo        │
│      ┌─────────┐      │  0:50 · 1080x1920 · 18,4 MB │
│      │  9:16   │      │                             │
│      │  player │      │  [ ⬇ Descargar MP4 ]        │
│      │         │      │  [ ✎ Abrir en el editor ]   │
│      └─────────┘      │  [ ⧉ Duplicar proyecto ]    │
│                       │                             │
│                       │  Se usaron 14 créditos      │
└───────────────────────┴─────────────────────────────┘
```

**Dos entregas, no una:** el MP4 y el proyecto abierto en el editor de HyperFrames.

### Qué se edita y qué no

| Pista | Editable |
|---|---|
| Subtítulos | Texto y estilo |
| Motion graphics | Tiempos y qué elemento entra |
| Recursos | Reemplazar el recurso |
| **Música** | **Cambiar tema, mover el corte, silenciar** |
| Avatar | **No** — volver al paso 4 |
| Voz | **No** — volver al paso 4 |

Las dos pistas generadas por proveedor externo se muestran bloqueadas **a propósito**: tocarlas no tendría efecto sin rehacer la generación, y dejar controles que no hacen nada es peor que no tenerlos.

---

## 13. Pantalla 10 — Centro de integraciones

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
│ 8 avatares · Avatar III       [Verificar][Desconectar]│
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

### Reglas

- **La clave nunca se muestra ni se devuelve.** Solo `••••` + últimos 4.
- Al pegar una clave se verifica **de inmediato** con una llamada de solo lectura. No se guarda una clave inválida sin avisar.
- Cada tarjeta dice **para qué sirve** en una línea, en lenguaje de usuario, no de API.
- Las opcionales están marcadas como tales.
- Enlace de ayuda por proveedor: "¿Dónde encuentro mi clave?" → guía paso a paso.
- **No hay selector de modelo de avatar.** La plataforma usa Avatar III siempre. La tarjeta de HeyGen lo muestra como dato informativo, no como control.

### Vinculación de ElevenLabs con HeyGen

La tarjeta de ElevenLabs tiene **dos líneas de estado**, no una: la cuenta y la vinculación con HeyGen. Al pegar la clave, la plataforma intenta provisionarla en HeyGen automáticamente.

**Si se pudo por API:** el usuario no ve nada más que un check verde. Cero pasos.

**Si HeyGen solo lo permite desde su panel**, se despliega un modo guiado *dentro de nuestra app* — nunca un "ve a HeyGen y configúralo":

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

Al comprobar, se re-sincroniza el catálogo de voces y se confirma cuántas voces clonadas quedaron visibles. Si son 0, el mensaje dice exactamente qué revisar.

**Si la vinculación falla pero HeyGen acepta audio externo**, no se bloquea nada: el paso 4 funciona igual. La segunda línea queda en ámbar como informativa. Solo si fallan **ambos** caminos se impide generar, con instrucciones concretas.

---

## 14. Pantalla 11 — Biblioteca

Grid de videos con filtros: **Todos · En proceso · Listos · Fallidos**, más búsqueda y filtro por nicho.

Cada tarjeta: miniatura 9:16, título, pill de nicho, duración, fecha y estado. Las que están en proceso muestran barra de progreso y paso actual. Las fallidas muestran el motivo y un botón de reintentar.

**Aquí vive el progreso de generación**, no en el dashboard.

---

## 15. Pantalla 12 — Perfil, equipo y facturación

Tres pestañas:

| Pestaña | Contenido |
|---|---|
| **Perfil** | Nombre, foto, correo, idioma. **Mi voz**: clonar voz con casilla de consentimiento obligatoria |
| **Equipo** | Miembros y roles (Propietario, Administrador, Editor, Lector). Invitar por correo |
| **Facturación** | Plan actual, créditos disponibles, historial del ledger, método de pago, facturas |

El historial de créditos muestra el ledger tal cual: fecha, motivo en español (`Compra`, `Reserva`, `Consumo`, `Devolución`), proyecto asociado y saldo resultante.

---

## 16. Pantalla 13 — Detalle de publicación

Métricas de un post concreto: curva de crecimiento en el tiempo (de `post_metrics`), comparación con la media del workspace, y —lo importante— **el proyecto que lo generó**, con enlace para duplicarlo.

Es donde se cierra el ciclo: *este gancho, este nicho y esta plantilla dieron este resultado*.

---

## 17. Estados globales

Toda pantalla que carga datos define cuatro estados. **Ninguno se improvisa.**

| Estado | Regla |
|---|---|
| **Vacío** | Ilustración + una frase que explique qué falta + una acción. Nunca una tabla vacía |
| **Cargando** | Skeleton con la forma del contenido real, no un spinner centrado |
| **Error** | Qué pasó en lenguaje llano + qué puede hacer el usuario + reintentar |
| **Parcial** | Se muestra lo que hay + aviso ámbar de lo que falta. Nunca se bloquea todo por un fallo parcial |

---

## 18. Responsive

| Ancho | Comportamiento |
|---|---|
| ≥ 1280 px | Layout completo: sidebar + contenido + panel derecho |
| 1024–1279 px | Panel derecho colapsa a pestaña |
| 768–1023 px | Sidebar colapsa a iconos; columnas se apilan |
| < 768 px | **Solo consulta**: dashboard, biblioteca y ver un video. El wizard muestra "Crea tus videos desde una pantalla más grande" |

El wizard es una herramienta de escritorio a propósito: elegir avatar, ajustar branding y revisar un storyboard de 6 frames no funciona en 375 px, y fingir que sí produce una experiencia peor que decirlo con claridad.

---

## 19. Accesibilidad

- Contraste **AA mínimo** sobre `#0B0B10` — se verifica con `hyperframes check` en las plantillas y con audit en la app
- Todo lo interactivo es alcanzable por teclado; el wizard avanza con Enter
- Foco visible en violeta, nunca `outline: none` sin reemplazo
- Los estados no se comunican **solo** por color: el punto verde/ámbar/rojo siempre va con texto
- `aria-live` en el progreso de generación
- Los previews de audio tienen control de teclado y no se reproducen automáticamente
