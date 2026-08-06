-- 029 — Transición de estado voz → estilo, con validación de audio completo · Sprint 4
--
-- Mismo patrón que confirm_script_and_hold/select_proposal (016_prompt_
-- profiles.sql, 020_select_proposal.sql): security definer bypassa RLS, así
-- que approve_voice valida pertenencia a mano con current_workspaces() antes
-- de tocar projects. search_path fijo desde el create function, mismo
-- criterio que 027/028 — no repetir la deuda de 023 (parchada recién en
-- 025_harden_search_path.sql). Ver 021_security_definer_grants.sql para el
-- REVOKE/GRANT que cierra el resto del hardening de esta función.
--
-- approve_voice es el punto de no-retorno del paso 4 (voz): el usuario ya
-- escuchó el audio sintetizado y lo aprueba. Dos guards antes de avanzar:
--
-- 1) no_scenes: un proyecto sin ninguna fila en scenes (guion nunca llegó a
--    desglosarse en escenas, o se está invocando esta función fuera de
--    orden) NO debe poder "aprobarse" — sin este chequeo, exists(... where
--    audio_asset_id is null) es false sobre un conjunto vacío y la función
--    avanzaría igual a 'styling' con cero escenas, mismo tipo de estado
--    vacío-pero-válido que select_proposal (020) evita para idea_proposals.
-- 2) incomplete_voice_generation: TODAS las filas de scenes del proyecto
--    necesitan su propio audio_asset_id ya subido a project-media e
--    insertado en assets — un guion parcialmente sintetizado (una llamada a
--    ElevenLabs falló a mitad de camino, o el flujo se interrumpió) no debe
--    avanzar. El paso de avatar (HeyGen) necesita el audio completo del
--    proyecto para generar el video, no puede generarlo bloque por bloque.
create or replace function approve_voice(p_project uuid, p_workspace uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from projects
    where id = p_project
      and workspace_id = p_workspace
      and workspace_id in (select current_workspaces())
  ) then
    raise exception 'not_authorized';
  end if;

  if not exists (select 1 from scenes where project_id = p_project) then
    raise exception 'no_scenes';
  end if;

  if exists (
    select 1 from scenes
    where project_id = p_project and audio_asset_id is null
  ) then
    raise exception 'incomplete_voice_generation';
  end if;

  update projects set status = 'styling', current_step = 5 where id = p_project;
end $$;

revoke execute on function approve_voice(uuid, uuid) from public;
grant  execute on function approve_voice(uuid, uuid) to authenticated;
