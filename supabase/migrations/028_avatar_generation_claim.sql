-- 028 — Lock atómico para la generación de avatar (HeyGen) · Sprint 4
--
-- Mismo problema y misma solución que 027_voice_generation_claim.sql, ahora
-- para el paso de avatar: disparar la generación del video en HeyGen es
-- otra llamada real y facturable a un proveedor externo (y, a diferencia de
-- ElevenLabs, un job asíncrono que después llega por webhook — ver
-- 010_execution.sql / render_jobs). Sin este lock, dos pestañas o un doble
-- submit disparan dos jobs de HeyGen para el mismo proyecto: gasto
-- duplicado de crédito, y dos webhooks de HeyGen compitiendo por escribir
-- el mismo asset kind='avatar_video'.
--
-- claim_avatar_generation hace el mismo UPDATE...WHERE atómico que 023/027:
-- el lock de fila de Postgres serializa los UPDATE concurrentes, así que
-- solo una llamada "gana" la fila y el resto devuelve false ANTES de gastar
-- nada. El timeout de 2 minutos cubre el caso de una función serverless que
-- muere a mitad de camino sin liberar el claim.
--
-- search_path = public fijo desde el create function, mismo criterio que
-- 027 — no repetir la deuda de 023 (parchada recién en 025).
alter table projects add column if not exists avatar_generation_claimed_at timestamptz;

create or replace function claim_avatar_generation(p_project uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_claimed boolean;
begin
  if not exists (
    select 1 from projects
    where id = p_project and workspace_id in (select current_workspaces())
  ) then
    raise exception 'not_authorized';
  end if;

  update projects
  set avatar_generation_claimed_at = now()
  where id = p_project
    and (avatar_generation_claimed_at is null or avatar_generation_claimed_at < now() - interval '2 minutes')
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end $$;

create or replace function release_avatar_generation(p_project uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from projects
    where id = p_project and workspace_id in (select current_workspaces())
  ) then
    raise exception 'not_authorized';
  end if;

  update projects set avatar_generation_claimed_at = null where id = p_project;
end $$;

revoke execute on function claim_avatar_generation(uuid) from public;
grant  execute on function claim_avatar_generation(uuid) to authenticated;

revoke execute on function release_avatar_generation(uuid) from public;
grant  execute on function release_avatar_generation(uuid) to authenticated;
