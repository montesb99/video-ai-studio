# Video AI Studio

> Convierte una idea o un enlace en un video vertical listo para publicar —guion viral, avatar hablando con tu voz clonada, motion graphics, música y branding— sin tocar un editor.

**Estado:** documentación completa. Sin código todavía.

---

## En una imagen

```
   1 Idea  →  2 Propuestas  →  3 Guion  →  4 Voz  →  5 Avatar y marca  →  6 Escenas
                                              │              │                 │
                                              ▼              ▼                 ▼
                                        ElevenLabs       HeyGen          HyperFrames
                                        audio +          avatar con      motion graphics
                                        tiempos por      lip-sync,       superpuesto,
                                        palabra          fondo alpha     música, subtítulos
                                                                              │
                                                                              ▼
                                                        MP4 9:16 + proyecto en el editor
```

---

## La decisión que define el proyecto

**No construimos un motor de render. Construimos un compilador de variables.**

HyperFrames renderiza video desde HTML y soporta el patrón *subir la plantilla una vez → renderizar N veces con variables*. Eso convierte todo el producto en: **entrada del usuario → JSON de variables → render**. Sin granja de FFmpeg, sin Chrome headless, sin infraestructura de video.

---

## Documentación

Léela en este orden.

| # | Documento | Qué contiene |
|---|---|---|
| 00 | [PRD](docs/00-PRD.md) | Producto, usuarios, los 6 pasos, módulos, fases, métricas, modelo de negocio |
| 01 | [Arquitectura](docs/01-ARCHITECTURE.md) | Stack, pipeline de 8 pasos, compilador de variables, capas, seguridad, sprints |
| 02 | [Modelo de datos](docs/02-DATA-MODEL.md) | Esquema SQL completo con políticas RLS, listo para migrar |
| 03 | [Integraciones](docs/03-INTEGRATIONS.md) | Contrato por proveedor: qué usamos, qué falla, qué hacemos |
| 04 | [Flujos UX](docs/04-UX-FLOWS.md) | Las 13 pantallas, estados, navegación, responsive, accesibilidad |
| 05 | [Design tokens](docs/05-DESIGN-TOKENS.md) | Paleta, tipografía, espaciado, componentes |
| 06 | [Copy en español](docs/06-COPY-ES.md) | Todos los textos de la interfaz. Alimenta `messages/es.json` |
| 07 | [Metodología de guion](docs/07-METODOLOGIA-GUION.md) | La capa de prompts. El activo central del producto |
| 08 | [Estructura de motion](docs/08-ESTRUCTURA-MOTION.md) | ⚠ **Pendiente de tu especificación** |
| — | [Prompts de imagen](prompts/gpt-image-frames.md) | 7 prompts listos para GPT Image |
| — | [**Prompt maestro de Claude Design**](prompts/CLAUDE-DESIGN-MASTER.md) | Las 13 pantallas, listo para pegar |

---

## Qué está bloqueado y por quién

| Bloqueo | Necesito | Bloquea |
|---|---|---|
| ⚠ **Estructura del motion graphics** | Tu especificación escena por escena en [`08-ESTRUCTURA-MOTION.md`](docs/08-ESTRUCTURA-MOTION.md) | **Sprint 4** — las plantillas no se construyen sin esto |
| Metodología de guion | Extraer la skill `diegoinnovacion-guiones` a `prompt_profiles` | Sprint 3 |
| Validación de la cadena | Tus claves de HeyGen y ElevenLabs | **Sprint 0** |
| Frames de diseño | Generar los 7 prompts y revisarlos | El prompt maestro de Claude Design |
| Calibración del motor | 5–10 guiones tuyos que funcionaron | Sprint 3 |
| Catálogo de música | Confirmar la fuente libre de derechos que prefieres | Sprint 4 |

---

## Los tres siguientes pasos

### 1. Spike 0 — Validar la cadena con tus claves (~1 hora)

La documentación de HeyGen ya confirmó lo grande: acepta audio externo (`audio_url`), Avatar III (`engine: {type: "avatar_iii"}`) y fondo transparente (`output_format: "webm"`). Queda lo que **solo tu cuenta puede responder**.

```bash
cp spike/.env.example spike/.env    # pega tus claves ahí, nunca en el chat
node spike/run-all.mjs
```

Ver [`spike/README.md`](spike/README.md). Responde:

1. ¿Tus looks soportan Avatar III?
2. **¿Tu avatar tiene *matting*?** — si no, no hay fondo transparente, y eso **cambia el diseño**: sin alpha no se puede poner motion graphics detrás del avatar
3. ¿Cómo suena tu voz clonada en 50 s, y cuál es el ritmo real de palabras?
4. ¿Cuántos créditos consume de verdad un video?

La pregunta 2 es la razón de correrlo **antes** de cerrar el diseño.

### 2. Generar los 7 frames de diseño

Abre [`prompts/gpt-image-frames.md`](prompts/gpt-image-frames.md), copia el preámbulo + cada prompt, y genera en 16:9. Revisa contra la lista de comprobación de la sección 9 del mismo archivo.

### 3. Rellenar la estructura del motion graphics

Abre [`docs/08-ESTRUCTURA-MOTION.md`](docs/08-ESTRUCTURA-MOTION.md) y rellena una sección por tipo de video. El formato está definido; solo falta tu contenido.

Cuando 2 y 3 estén listos, se escribe el **prompt maestro para Claude Design** con las 13 pantallas.

---

## Stack

| Capa | Elección |
|---|---|
| Frontend | Next.js 15 · TypeScript · Tailwind · shadcn/ui |
| DB · Auth · Storage | Supabase (Postgres + RLS) |
| Orquestación | Inngest |
| Hosting | Vercel |
| Voz | ElevenLabs (BYOK, vinculada a HeyGen desde la app) |
| Avatar | HeyGen (BYOK) — **solo Avatar III**, sin selector |
| Render | HyperFrames Cloud |
| Imágenes | GPT Image (BYOK) |
| Guiones | Claude Sonnet 5 / Opus 5 |
| Métricas | Meta Graph API |
| Pagos | Stripe |
| Idioma | Español (es-419), `next-intl` |

---

## Convenciones

- **Interfaz en español, código en inglés.** Tablas, columnas, variables y commits en inglés. Cero strings en JSX: todos en `messages/es.json`.
- **RLS en toda tabla con `workspace_id`.** El aislamiento vive en Postgres, no en el código.
- **Ledger de créditos append-only**, patrón `hold → commit | refund`. Nunca un `UPDATE` sobre un saldo.
- **Toda llamada que gasta dinero lleva `Idempotency-Key`.** Los webhooks se deduplican por `(provider, external_id)` UNIQUE.
- **Si el fallo es nuestro o del proveedor, el usuario no paga.** El refund es automático, no una gestión de soporte.
