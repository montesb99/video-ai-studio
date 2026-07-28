-- 021 — Hardening de EXECUTE en funciones security definer · Sprint 3
--
-- Postgres otorga EXECUTE a PUBLIC por defecto en cada `create function`, y
-- Supabase expone toda función del schema public como POST /rest/v1/rpc/<fn>
-- para cualquier rol que tenga ese privilegio (anon y authenticated heredan
-- de PUBLIC salvo REVOKE explícito). Ninguna de las 021 migraciones previas
-- (001-020) revocaba esto — no había hecho falta porque credits_move solo se
-- llamaba desde dentro de otra función security definer. Sprint 3 agrega dos
-- funciones pensadas para invocarse desde supabase.rpc() con el cliente de
-- sesión del usuario (confirm_script_and_hold, select_proposal), así que
-- toca dejar explícito qué es invocable desde el cliente y qué no:
--
-- credits_move: NUNCA debe ser invocable directo por anon/authenticated.
-- No valida que el llamante pertenezca a p_workspace, y acepta p_delta
-- positivo — sin este REVOKE, cualquier usuario autenticado podía llamar
-- supabase.rpc('credits_move', { p_workspace: '<cualquier-workspace>',
-- p_delta: 999999, p_reason: 'grant', p_project: null }) y acreditarse
-- crédito en cualquier workspace, propio o ajeno. Queda accesible solo para
-- las funciones que la envuelven (confirm_script_and_hold), que corren con
-- los privilegios del dueño de la función independientemente de este REVOKE.
revoke execute on function credits_move(uuid, integer, credit_reason, uuid) from public;

-- confirm_script_and_hold y select_proposal SÍ deben ser invocables por
-- usuarios autenticados: la app las llama vía supabase.rpc() con el cliente
-- de sesión (app/(app)/create/[projectId]/guion/actions.ts,
-- app/(app)/create/[projectId]/propuestas/actions.ts). Ahora que ambas
-- validan pertenencia con current_workspaces() en su propio cuerpo
-- (016_prompt_profiles.sql, 020_select_proposal.sql), se restringe el GRANT
-- a 'authenticated' en vez de dejar el default de PUBLIC, que también
-- incluye 'anon'.
revoke execute on function confirm_script_and_hold(uuid, uuid, uuid, integer) from public;
grant  execute on function confirm_script_and_hold(uuid, uuid, uuid, integer) to authenticated;

revoke execute on function select_proposal(uuid, uuid) from public;
grant  execute on function select_proposal(uuid, uuid) to authenticated;
