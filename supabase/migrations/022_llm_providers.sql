-- 022 — BYOK de Anthropic y Gemini para ideación/guion · Sprint 3 (Parte E)
--
-- Habilita que un workspace conecte su propia clave de Anthropic o Gemini en
-- /integrations. Si no conecta ninguna, la generación sigue usando la
-- ANTHROPIC_API_KEY de plataforma (lib/pipeline/llm-provider.ts#resolveGenerator)
-- — comportamiento sin cambios para quien no use esta integración nueva.
alter type provider_name add value 'anthropic';
alter type provider_name add value 'gemini';
