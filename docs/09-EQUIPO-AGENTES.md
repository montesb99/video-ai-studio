# 09 — Equipo de agentes · Video AI Studio

> Cómo se organiza el desarrollo asistido de este proyecto en Claude Code.
> Última actualización: 27 jul 2026

---

## El orquestador

No existe un "agente orquestador" como archivo aparte. Un subagente lanzando a otros subagentes no aporta beneficio real en Claude Code y sí añade latencia y costo. **La sesión principal de Claude Code cumple ese rol**: decide qué especialista consultar, en qué momento, y cómo reconciliar sus hallazgos. Este documento es el protocolo que sigue para hacerlo de forma consistente entre sesiones.

## Los 4 especialistas

Viven en `.claude/agents/*.md`, ámbito de proyecto (no globales), invocables con la herramienta `Agent` pasando su `name` como `subagent_type`.

| Agente | Dominio | Herramientas |
|---|---|---|
| `api-architect` | Arquitectura de integración con APIs externas y optimización de tokens/costo | Read, Grep, Glob, WebFetch, WebSearch, Bash, Edit |
| `ux-ui-guardian` | Fidelidad de la UI a los flujos, tokens de diseño y copy aprobados | Read, Grep, Glob, Edit |
| `devops-architecture-lead` | Coherencia de la arquitectura completa: RLS, migraciones, config de deploy, seguridad | Read, Grep, Glob, Bash, Edit |
| `bug-watcher` | Caza de bugs de correctitud, reporta con `ReportFindings` | Read, Grep, Glob, Bash, ReportFindings |

## Reglas de delegación

| Se toca... | Se consulta a... |
|---|---|
| `lib/providers/**`, `lib/pipeline/**`, cualquier system prompt nuevo | `api-architect` |
| `app/**`, componentes de UI, Tailwind/shadcn config | `ux-ui-guardian` |
| `supabase/migrations/**`, `.env.example`, config de Vercel/Inngest, antes de cada push | `devops-architecture-lead` |
| **Cualquier cambio de código no trivial**, sin excepción, antes de darlo por terminado | `bug-watcher` |

Cuando un cambio toca más de un dominio (p. ej. una migración nueva que además cambia un provider), se consulta a más de un especialista.

## Paralelismo

Cuando los especialistas relevantes no dependen entre sí, se lanzan **en el mismo turno, con múltiples llamadas a `Agent` en un solo mensaje** — no en secuencia. Ejemplo: al cerrar el Sprint 4 (plantilla + compilador + providers), `api-architect` y `devops-architecture-lead` pueden correr en paralelo; `bug-watcher` corre después, sobre el resultado ya integrado.

## Reconciliación de hallazgos en conflicto

1. **Seguridad y correctitud (`devops-architecture-lead`, `bug-watcher`) ganan** sobre preferencias de estilo o costo (`api-architect`, `ux-ui-guardian`) cuando hay tensión directa.
2. Un hallazgo que contradice una decisión ya tomada explícitamente por el usuario (ver `docs/00-PRD.md` y el historial de correcciones) no se revierte solo porque un agente lo señale — se reporta al usuario para que decida.
3. Los hallazgos mecánicos (falta una política RLS, un string hardcodeado, una var de entorno faltante en el example) se corrigen directamente. Los hallazgos de diseño o producto se reportan, no se imponen.

## Qué no reemplaza este equipo

- No reemplaza `/code-review` ni `/security-review` para una revisión formal antes de un PR — son complementarios. `bug-watcher` es la pasada rápida y continua durante el desarrollo.
- No reemplaza al usuario en decisiones de producto (qué se prioriza, qué keyword de CTA usar, qué estilo de motion graphics). Esos siguen siendo del usuario, informados por `docs/00-PRD.md` y `docs/07-METODOLOGIA-GUION.md`.
