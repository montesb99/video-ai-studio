-- 008 — Assets, slots y música · docs/02-DATA-MODEL.md §7

create table assets (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  project_id    uuid references projects(id) on delete cascade,
  kind          asset_kind not null,
  source        asset_source not null default 'upload',
  storage_path  text not null,
  mime          text not null,
  bytes         bigint,
  duration_ms   integer,
  width         integer,
  height        integer,
  checksum      text,
  analysis_json jsonb,     -- qué muestra, colores, si trae texto
  gen_prompt    text,      -- solo generated_image
  gen_model     text,
  created_at    timestamptz not null default now()
);

create index on assets (workspace_id, kind);
create index on assets (checksum);
create index on assets (gen_prompt) where kind = 'generated_image';

create table slot_assignments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  slot_id     text not null,       -- 'hook-bg', 'dato-1', 'broll-2'
  asset_id    uuid not null references assets(id) on delete cascade,
  assigned_by assigned_by not null default 'ai',
  confidence  numeric(3,2),
  reason      text,                -- "Sugerido para: Dato — 00:15"
  created_at  timestamptz not null default now(),
  unique (project_id, slot_id)
);

create table music_tracks (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  style                music_style not null,
  block_role           music_role not null,
  video_types          video_type[] not null default '{}',
  bpm                  smallint,
  duration_ms          integer not null,
  storage_path         text not null,
  license              text not null,
  attribution_required boolean not null default false,
  source_url           text,
  is_active            boolean not null default true
);

create index on music_tracks (block_role, style) where is_active;
