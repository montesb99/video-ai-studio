-- 019 — Vocabulario de palabra clave CTA · docs/07-METODOLOGIA-GUION.md §6.2
-- INNOVACION se mantiene primero en el array = primera sugerencia en la UI
-- (regla dura de CLAUDE.md: palabra clave por defecto).

update cta_library
set keyword_suggestions_json = '["INNOVACION", "IA", "AUTOMATIZA", "AGENTE", "BOT", "SISTEMA", "PLANTILLA", "GPT", "FLUJO"]'
where goal = 'leads' and niche_slug is null;
