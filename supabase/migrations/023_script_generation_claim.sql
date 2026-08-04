-- 023 — Lock atómico para la generación automática de guion · Sprint 3 Parte E
--
-- bug-watcher encontró que el guard de "no generar dos veces" al elegir una
-- propuesta (app/(app)/create/[projectId]/propuestas/_components/proposals-grid.tsx)
-- solo vive en el árbol de React de esa pestaña: dos pestañas, o un doble
-- submit por red lenta, disparan dos runGenerateScript concurrentes. El
-- unique(project_id, version) de la tabla scripts evita corrupción de datos,
-- pero no evita el gasto duplicado de una llamada completa al LLM (crédito
-- BYOK real del usuario) ni el fallo silencioso de la segunda invocación.
--
-- claim_script_generation hace un UPDATE...WHERE atómico sobre projects: solo
-- una llamada concurrente puede "ganar" la fila (el lock de fila de Postgres
-- serializa los UPDATE concurrentes), así que el resto puede devolver
-- false de inmediato, ANTES de gastar ninguna llamada al LLM. El timeout de
-- 2 minutos cubre el caso de que una función serverless muera a mitad de
-- camino (timeout de Vercel, crash) sin liberar el claim.
alter table projects add column if not exists script_generation_claimed_at timestamptz;

create or replace function claim_script_generation(p_project uuid) returns boolean
language plpgsql security definer as $$
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
  set script_generation_claimed_at = now()
  where id = p_project
    and (script_generation_claimed_at is null or script_generation_claimed_at < now() - interval '2 minutes')
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end $$;

create or replace function release_script_generation(p_project uuid) returns void
language plpgsql security definer as $$
begin
  if not exists (
    select 1 from projects
    where id = p_project and workspace_id in (select current_workspaces())
  ) then
    raise exception 'not_authorized';
  end if;

  update projects set script_generation_claimed_at = null where id = p_project;
end $$;

revoke execute on function claim_script_generation(uuid) from public;
grant  execute on function claim_script_generation(uuid) to authenticated;

revoke execute on function release_script_generation(uuid) from public;
grant  execute on function release_script_generation(uuid) to authenticated;
