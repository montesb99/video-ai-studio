-- 020 — Selección de propuesta en una sola transacción · Sprint 3
-- Una sola sentencia con CASE en vez de dos updates separados desde la app:
-- nunca hay un estado transitorio con cero o dos propuestas seleccionadas.
--
-- ⚠ security definer bypassa RLS: valida pertenencia a mano. Sin el chequeo
-- de p_project contra current_workspaces(), cualquier usuario autenticado
-- podía invocar esta función sobre un proyecto de OTRO workspace y forzarlo
-- a 'scripting'. Sin el chequeo de que p_proposal pertenece a p_project, un
-- p_proposal inválido/ajeno deselecciona TODAS las propuestas del proyecto
-- (is_selected = false para todas, porque ninguna fila matchea el id) y de
-- todos modos avanza projects.status — dejando el proyecto en 'scripting'
-- sin ninguna propuesta seleccionada, justo el estado transitorio que el
-- índice único parcial de idea_proposals (007_scripts_and_scenes.sql) existe
-- para impedir. Ver 021_security_definer_grants.sql para el REVOKE de
-- EXECUTE que cierra la otra mitad.
create or replace function select_proposal(p_project uuid, p_proposal uuid) returns void
language plpgsql security definer as $$
begin
  if not exists (
    select 1 from projects
    where id = p_project and workspace_id in (select current_workspaces())
  ) then
    raise exception 'not_authorized';
  end if;

  if not exists (select 1 from idea_proposals where id = p_proposal and project_id = p_project) then
    raise exception 'invalid_proposal';
  end if;

  update idea_proposals set is_selected = (id = p_proposal) where project_id = p_project;
  update projects set status = 'scripting', current_step = 3 where id = p_project;
end $$;
