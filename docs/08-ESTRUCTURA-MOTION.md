# 08 — Estructura del motion graphics · Video AI Studio

> ⚠ **DOCUMENTO PENDIENTE.** Esta es la plantilla que espera tu especificación.
> **Bloquea el Sprint 4.** Sin esto, las plantillas de HyperFrames no se construyen.
> Última actualización: 25 jul 2026

---

## Por qué este documento está vacío

Todo lo demás del producto se puede diseñar desde principios: la arquitectura, el modelo de datos, el flujo, los prompts. **Esto no.**

La estructura del motion graphics es una decisión creativa y de marca que tienes tú, no yo. Inventarla produciría plantillas genéricas que se ven como las de cualquier herramienta de IA — exactamente lo que estamos evitando.

Lo que sigue es el **formato exacto en que necesito recibirla**. Rellena una sección por cada tipo de video.

---

## Cómo se traduce a código

Lo que escribas aquí se convierte 1:1 en tres cosas:

```
tu especificación
   │
   ├──► templates/<slug>-9x16/index.html   la composición HyperFrames
   ├──► templates.slots_json               los huecos de recursos
   └──► templates.beats_json               el ritmo de 8 segundos
```

No hay interpretación de por medio. Si dices "a los 8 s entra una tarjeta de dato desde la derecha con rebote", eso es lo que se construye.

---

## Restricciones técnicas que debes conocer

Antes de escribir, estas son las reglas del motor. No son negociables porque vienen del framework de render:

| Restricción | Qué implica para tu diseño |
|---|---|
| **El avatar viene con fondo transparente** | ✅ Verificado. Puedes poner cosas por delante y por detrás. Recortarlo, escalarlo y moverlo. Borde limpio: 1,76 % semitransparente |
| **El fondo lo decides tú, por escena** | En escenas de avatar pones un **fondo natural** (para que no parezca recortado); en escenas de motion, la **animación completa** con el avatar superpuesto. Un solo render sirve para ambos |
| **Las capas se apilan, no se mezclan** | Fondo → avatar → recursos → motion graphics → subtítulos |
| **Cambio visual cada ≤ 8 segundos** | Ningún plano puede durar más sin que algo cambie |
| **Los tiempos vienen del audio** | Las transiciones se alinean con los tiempos por palabra, para caer entre frases |
| **El render es determinista** | Nada de aleatoriedad, nada de bucles infinitos. Cada animación tiene inicio y fin definidos |
| **Duración total: 50 s** | 4 bloques: hook 0–3, promesa 3–8, contenido 8–43, CTA 43–50 |
| **Formato: 1080×1920 (9:16)** | Vertical, para Reels y TikTok |
| **El texto lo pone el motor, no la imagen** | Las imágenes generadas nunca llevan texto. Toda tipografía es real y editable |

---

## Formato de especificación

### Plantilla a rellenar — repetir por cada tipo de video

````markdown
# Tipo de video: [Informativo / Reacción / Desde un enlace]

## Resumen
Una frase: qué sensación debe dar este formato.

## Escenas

### Escena 1 — [nombre]
- **Tiempo:** 00:00 – 00:08
- **Bloque del guion:** hook
- **Qué se ve:** [motion completo / avatar + subtítulos / avatar + recurso / split]
- **Fondo (pista 0):** [natural: gradiente con viñeta / foto de entorno / desenfoque de marca]
  **o** [animado: la animación completa, con el avatar superpuesto encima]
- **Elementos que entran:**
  1. `[qué]` — desde `[dónde]` — animación `[cuál]` — en el segundo `[t]`
  2. ...
- **Avatar:** [no aparece / recortado a la derecha 40 % / centrado pecho arriba / …]
- **Subtítulos:** [sí, karaoke abajo / no, manda el motion / sí, centrados grandes]
- **Slot de recurso:** `[id-del-slot]` · aspecto `[9:16 / 1:1 / 4:5]` · tipo `[imagen / video / ninguno]`
- **Transición a la siguiente:** [corte seco / desplazamiento lateral / máscara / zoom / …]

### Escena 2 — [nombre]
...

## Beats
Segundos exactos donde algo cambia: `0, 8, 16, 24, 32, 40, 46`

## Reglas propias de este formato
- ...
````

---

## Ejemplo del nivel de detalle que necesito

> ⚠ **Esto es un EJEMPLO DE FORMATO, no una propuesta.** Sirve solo para mostrar cuánto detalle hace falta. Sustitúyelo entero.

````markdown
### Escena 3 — Tarjeta de dato
- **Tiempo:** 00:16 – 00:24
- **Bloque del guion:** contenido
- **Qué se ve:** motion completo (el avatar cede toda la pantalla)
- **Fondo:** gradiente del color primario al secundario, diagonal 135°
- **Elementos que entran:**
  1. `número grande` — desde abajo — sube 40 px con fade, ease-out 0,5 s — en 16,2 s
  2. `etiqueta del dato` — sin desplazamiento — solo fade 0,3 s — en 16,6 s
  3. `barra de progreso` — crece de 0 a 100 % de ancho, 0,8 s — en 17,0 s
  4. `fuente del dato` en micro-tipografía — fade 0,3 s — en 17,8 s
- **Avatar:** no aparece
- **Subtítulos:** no — el dato en pantalla ya es el mensaje
- **Slot de recurso:** `dato-1` · aspecto `1:1` · tipo `imagen` (opcional; si está vacío, solo tipografía)
- **Transición a la siguiente:** máscara circular que se cierra sobre el avatar entrante, 0,4 s
````

---

## Qué necesito además de las escenas

### 1. Referencias visuales

Videos tuyos o de terceros que representen lo que quieres. Con un comentario de **qué te gusta de cada uno**: "el ritmo de cortes", "cómo entra el texto", "el estilo de las tarjetas de dato". Sin ese comentario, una referencia se puede interpretar de cinco formas distintas.

### 2. La lista de slots

Por cada tipo de video, los huecos donde caben recursos del usuario:

| slot_id | Rol | Aspecto | Tipo | Bloque | Obligatorio |
|---|---|---|---|---|---|
| `hook-bg` | Fondo del gancho | 9:16 | imagen o video | hook | No |
| `dato-1` | Gráfico del dato | 1:1 | imagen | contenido | No |
| `apoyo-1` | Imagen junto al avatar | 4:5 | imagen | contenido | No |
| `broll-1` | B-roll de transición | 9:16 | video | contenido | No |

Esto es lo que alimenta la asignación automática: cuando alguien sube una foto, se compara contra estos slots para decidir dónde encaja.

### 3. Confirmación de la música

Ya está definido el mapa por bloque, pero confirma que te encaja:

| Tipo | Hook + Promesa | Contenido + CTA |
|---|---|---|
| Informativo | Inspiracional épico | Corporate loop |
| Reacción | Épico con tensión | Tech house |
| Desde un enlace | Heredado del análisis | Heredado |

Y dime de qué **fuente libre de derechos** prefieres que saquemos el catálogo.

---

## Estado de cada plantilla

| Plantilla | Estado | Bloquea |
|---|---|---|
| **Informativo** | ⬜ Pendiente de tu especificación | Sprint 4 |
| **Reacción** | ⬜ Pendiente | Sprint 4 |
| **Desde un enlace** | ⬜ Pendiente | Sprint 4 |

---

## Verificación (cuando la plantilla exista)

```bash
npx hyperframes lint
npx hyperframes check                        # debe dar 0 hallazgos
npx hyperframes snapshot --at 3,16,28,43     # revisar cada frame a ojo
npx hyperframes preview                      # revisar el timeline completo
npx hyperframes cloud render --dry-run --json
```

Solo después de que `check` dé 0 hallazgos y los snapshots se vean bien, se sube y se registra el `hyperframes_asset_id` en `templates`.
