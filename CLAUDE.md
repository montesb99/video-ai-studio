# Video AI Studio

SaaS que convierte una idea o enlace en un video vertical listo para publicar: guion viral, avatar HeyGen hablando con voz clonada de ElevenLabs, motion graphics HyperFrames, música y branding — sin editor manual. Usuario objetivo: no técnico. Ver `README.md` para el índice completo de documentación.

## Reglas duras (no negociables)

- **Interfaz 100% en español (es-419).** Cero strings hardcodeados en JSX — todo vía `next-intl` desde `messages/es.json`. El código (tablas, variables, commits) va en inglés.
- **RLS en toda tabla con `workspace_id`.** El aislamiento vive en Postgres, no en el código de la app.
- **Avatar III es el único modelo de HeyGen.** Fijo como constante en `lib/providers/heygen.ts`, sin selector en la UI, no se lee de la base de datos al generar.
- **`scripts.blocks_json` separa `spoken` de `onScreen` por bloque.** Solo `spoken` (ya normalizado para voz) llega a ElevenLabs. Ver `docs/07-METODOLOGIA-GUION.md` §3-bis — esto causó un bug real en el spike (el avatar pronunciaba etiquetas y citas de fuente en voz alta).
- **Ledger de créditos append-only**, patrón `hold → commit | refund` vía `credits_move()`. Nunca un `UPDATE` directo sobre un saldo.
- **Toda llamada que gasta crédito lleva `Idempotency-Key`.** Webhooks se deduplican por `(provider, external_id)` UNIQUE.
- **402 y 409 de proveedores nunca se reintentan.**
- **Ningún secreto (API key, token) se pega en el chat, nunca.** Van a `.env.local` (gitignored) o al panel de secretos del hosting. Si algo así llega a aparecer en el chat, se trata como comprometido y se rota de inmediato.
- **Palabra clave de CTA por defecto: `INNOVACION`** — mayúsculas y sin tildes en pantalla, minúscula y con tilde en el texto hablado.

## Documentación

Todo en `docs/00` a `docs/09`, leer en orden — ver el índice en `README.md`. En particular:
- `docs/01-ARCHITECTURE.md` — stack, pipeline de 8 pasos, estructura del repo, seguridad
- `docs/02-DATA-MODEL.md` — esquema SQL completo con RLS, listo para migrar
- `docs/03-INTEGRATIONS.md` — contratos de API **verificados** contra las APIs reales (no asumidos)

## Equipo de agentes

Antes de dar por terminado un cambio, consulta al especialista que corresponda — ver `docs/09-EQUIPO-AGENTES.md` para las reglas de delegación completas:

| Se tocó... | Se consulta a... |
|---|---|
| `lib/providers/**`, `lib/pipeline/**`, prompts | `api-architect` |
| `app/**`, UI, Tailwind/shadcn | `ux-ui-guardian` |
| `supabase/migrations/**`, config de deploy | `devops-architecture-lead` |
| Cualquier cambio de código no trivial | `bug-watcher` |

Los que no dependen entre sí se lanzan en paralelo, en un solo mensaje.
