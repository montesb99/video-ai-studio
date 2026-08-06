-- 027 — Lock atómico para la generación de voz (ElevenLabs) · Sprint 4
--
-- Mismo problema que claim_script_generation (023_script_generation_claim.sql):
-- sintetizar el audio de cada bloque del guion con ElevenLabs es una llamada
-- real y facturable a un proveedor externo. Sin un lock atómico en Postgres,
-- dos pestañas o un doble submit por red lenta disparan dos corridas
-- concurrentes de síntesis sobre el mismo proyecto — gasto duplicado de
-- crédito BYOK del usuario, y dos escrituras concurrentes pisándose sobre
-- scenes.audio_asset_id.
--
-- claim_voice_generation hace el mismo UPDATE...WHERE atómico que 023: el
-- lock de fila de Postgres serializa los UPDATE concurrentes, así que solo
-- una llamada "gana" la fila y el resto devuelve false ANTES de gastar nada.
-- El timeout de 2 minutos cubre el caso de una función serverless que muere
-- a mitad de camino (timeout de Vercel, crash) sin liberar el claim.
--
-- A diferencia de 023 (que no fijaba search_path y necesitó el parche de
-- 025_harden_search_path.sql), acá se fija `search_path = public` directo en
-- el create function de ambas funciones — no repetir la misma deuda.
alter table projects add column if not exists voice_generation_claimed_at timestamptz;

create or replace function claim_voice_generation(p_project uuid) returns boolean
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
  set voice_generation_claimed_at = now()
  where id = p_project
    and (voice_generation_claimed_at is null or voice_generation_claimed_at < now() - interval '2 minutes')
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end $$;

create or replace function release_voice_generation(p_project uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from projects
    where id = p_project and workspace_id in (select current_workspaces())
  ) then
    raise exception 'not_authorized';
  end if;

  update projects set voice_generation_claimed_at = null where id = p_project;
end $$;

revoke execute on function claim_voice_generation(uuid) from public;
grant  execute on function claim_voice_generation(uuid) to authenticated;

revoke execute on function release_voice_generation(uuid) from public;
grant  execute on function release_voice_generation(uuid) to authenticated;
