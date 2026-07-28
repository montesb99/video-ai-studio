-- 016 — Metodología de guion versionada · docs/07-METODOLOGIA-GUION.md §2
--
-- No estaba en las migraciones 001-015 pese a estar en el data model
-- documentado — es la Capa 1 (metodología base) y la de instrucciones de
-- tarea (ideación/guion/edición asistida) que necesita el Sprint 3 para
-- generar propuestas y guiones. El perfil de nicho (Capa 2) sigue viviendo
-- en niches.system_prompt/hook_patterns_json (006_content.sql) — no se
-- duplica aquí; 'niche' queda reservado en el check por si algún día se
-- decide versionar perfiles de nicho fuera de esa tabla.

create table prompt_profiles (
  id          uuid primary key default gen_random_uuid(),
  layer       text not null check (layer in ('methodology', 'niche', 'task')),
  key         text not null,
  version     smallint not null,
  content     text not null,
  changelog   text,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (layer, key, version)
);

create unique index on prompt_profiles (layer, key) where is_active;

-- Sin políticas: ni anon ni authenticated pueden leerla. Es la metodología
-- propietaria (docs/07 §1, "el activo central del producto") — si tuviera
-- una policy de select para authenticated, cualquier usuario podría leerla
-- completa vía PostgREST con su propio JWT, sin pasar por nuestra UI. Mismo
-- criterio que webhook_events/subscriptions (014_rls_policies.sql): solo se
-- lee con la service role key, desde lib/pipeline/prompts.ts.
alter table prompt_profiles enable row level security;

-- Hold de créditos + confirmación de guion en una sola transacción — evita
-- la ventana donde el hold se aplica pero la confirmación del guion falla.
--
-- ⚠ security definer bypassa RLS: esta función NO hereda las políticas de
-- projects/scripts, así que valida pertenencia a mano con current_workspaces()
-- antes de tocar nada. Sin esto, cualquier usuario autenticado podía invocar
-- supabase.rpc('confirm_script_and_hold', {...}) directo (sin pasar por
-- app/(app)/create/[projectId]/guion/actions.ts) con un p_workspace/p_project
-- ajenos, o con p_credits negativo para acreditarse saldo gratis vía
-- credits_move(p_workspace, -p_credits, 'hold', ...). Ver 021_security_
-- definer_grants.sql para el REVOKE de EXECUTE que cierra la otra mitad.
-- ⚠ Idempotencia: sin el guard de `v_already_confirmed`, dos llamadas
-- concurrentes a esta función (doble clic en "Confirmar guion", o un
-- reintento de red del Server Action) mantenían un hold de créditos CADA
-- UNA — credits_move() no tiene ninguna noción de "este script ya generó su
-- hold", así que el segundo hold pasaba igual si el balance alcanzaba,
-- cobrando el video dos veces. `select ... for update` sobre la fila de
-- scripts serializa las llamadas concurrentes (la segunda espera a que la
-- primera confirme) y, una vez confirmada, la segunda se vuelve un no-op
-- que devuelve el balance actual sin tocar el ledger — mismo efecto que una
-- Idempotency-Key.
create or replace function confirm_script_and_hold(
  p_script uuid, p_project uuid, p_workspace uuid, p_credits integer
) returns integer language plpgsql security definer as $$
declare
  v_balance integer;
  v_already_confirmed boolean;
begin
  if p_credits <= 0 then
    raise exception 'invalid_credits';
  end if;

  if not exists (
    select 1 from projects
    where id = p_project
      and workspace_id = p_workspace
      and workspace_id in (select current_workspaces())
  ) then
    raise exception 'not_authorized';
  end if;

  select is_confirmed into v_already_confirmed
    from scripts where id = p_script and project_id = p_project
    for update;

  if v_already_confirmed is null then
    raise exception 'invalid_script';
  end if;

  if v_already_confirmed then
    select credits_balance into v_balance from workspaces where id = p_workspace;
    return v_balance;
  end if;

  v_balance := credits_move(p_workspace, -p_credits, 'hold', p_project);

  update scripts set is_confirmed = true, confirmed_at = now()
    where id = p_script and project_id = p_project;

  update projects set status = 'voicing', current_step = 4
    where id = p_project;

  return v_balance;
end $$;
