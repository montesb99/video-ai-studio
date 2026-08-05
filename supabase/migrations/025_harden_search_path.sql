-- 025 — search_path fijo en funciones security definer · hardening
--
-- Hallazgo de devops-architecture-lead durante la revisión de 023/024: desde
-- 013_functions.sql en adelante, ninguna función security definer nueva
-- fijaba `search_path` (solo handle_new_user, 002_identity_and_tenancy.sql,
-- lo hacía) — es exactamente el lint "Function Search Path Mutable" del
-- Security Advisor de Supabase. Sin un search_path fijo, una función
-- security definer resuelve nombres de objetos sin calificar (tablas,
-- funciones) contra el search_path del ROL QUE LA EJECUTA, no del dueño —
-- si algún rol con privilegios de CREATE lograra colar un objeto con el
-- mismo nombre en un schema que aparezca antes que public en ese
-- search_path, la función terminaría operando sobre el objeto falso en vez
-- del real. No es una vulnerabilidad explotable hoy con la configuración
-- actual del proyecto, pero fijar search_path es la mitigación estándar y
-- de costo cero — no cambia ningún comportamiento de estas funciones.
--
-- No retroactivo a 013-023 (ya aplicadas): ALTER FUNCTION ... SET es
-- idempotente y no toca el cuerpo de la función, así que es seguro
-- aplicarlo como migración nueva en vez de editar las que ya corrieron.
alter function current_workspaces() set search_path = public;
alter function credits_move(uuid, integer, credit_reason, uuid) set search_path = public;
alter function confirm_script_and_hold(uuid, uuid, uuid, integer) set search_path = public;
alter function select_proposal(uuid, uuid) set search_path = public;
alter function claim_script_generation(uuid) set search_path = public;
alter function release_script_generation(uuid) set search_path = public;
