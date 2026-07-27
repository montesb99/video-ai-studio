-- 014 — Row Level Security · docs/02-DATA-MODEL.md §12
-- El aislamiento vive en Postgres, no en el código de la app. Toda tabla
-- con datos de un workspace queda cubierta aquí — incluida audit_log,
-- workspaces y profiles, que el doc no detalla fila por fila pero caen
-- bajo el mismo principio ("RLS en toda tabla con workspace_id").

-- ── profiles y workspaces: identidad y tenancy ──

alter table profiles enable row level security;

create policy profiles_select on profiles for select
  using (id = auth.uid());

create policy profiles_update on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

alter table workspaces enable row level security;

create policy workspaces_select on workspaces for select
  using (id in (select current_workspaces()));

create policy workspaces_update on workspaces for update
  using (id in (select current_workspaces()))
  with check (id in (select current_workspaces()));

alter table workspace_members enable row level security;

create policy workspace_members_select on workspace_members for select
  using (workspace_id in (select current_workspaces()));

-- ── Patrón general: tablas con workspace_id propio ──
-- projects, assets, brand_kits, avatars, voices, integrations,
-- social_accounts, publications, credit_ledger, audit_log

do $$
declare
  t text;
  tables text[] := array[
    'projects', 'assets', 'brand_kits', 'avatars', 'voices',
    'integrations', 'social_accounts', 'publications',
    'credit_ledger', 'audit_log'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_select on %I for select using (workspace_id in (select current_workspaces()))',
      t, t
    );
    execute format(
      'create policy %I_insert on %I for insert with check (workspace_id in (select current_workspaces()))',
      t, t
    );
    execute format(
      'create policy %I_update on %I for update using (workspace_id in (select current_workspaces())) with check (workspace_id in (select current_workspaces()))',
      t, t
    );
    execute format(
      'create policy %I_delete on %I for delete using (workspace_id in (select current_workspaces()))',
      t, t
    );
  end loop;
end $$;

-- ── Tablas hijas sin workspace_id propio: se resuelven vía project_id ──
-- input_sources, idea_proposals, scripts, scenes, slot_assignments, render_jobs

do $$
declare
  t text;
  tables text[] := array[
    'input_sources', 'idea_proposals', 'scripts', 'scenes',
    'slot_assignments', 'render_jobs'
  ];
begin
  foreach t in array tables loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_all on %I for all using (exists (select 1 from projects p where p.id = %I.project_id and p.workspace_id in (select current_workspaces())))',
      t, t, t
    );
  end loop;
end $$;

-- ── post_metrics: se resuelve vía publication_id → publications.workspace_id ──

alter table post_metrics enable row level security;

create policy post_metrics_all on post_metrics for all
  using (
    exists (
      select 1 from publications pub
      where pub.id = post_metrics.publication_id
        and pub.workspace_id in (select current_workspaces())
    )
  );

-- ── Tablas globales (solo lectura) ──

alter table niches        enable row level security;
alter table cta_library   enable row level security;
alter table templates     enable row level security;
alter table music_tracks  enable row level security;

create policy niches_read       on niches       for select using (is_active);
create policy cta_read          on cta_library  for select using (is_active);
create policy templates_read    on templates    for select using (is_active);
create policy music_read        on music_tracks for select using (is_active);

-- ── Nunca accesibles desde el cliente ──
-- webhook_events y subscriptions solo se tocan con la service role key.

alter table webhook_events enable row level security;
alter table subscriptions  enable row level security;
-- sin políticas = nadie con anon/authenticated puede leerlas ni escribirlas
