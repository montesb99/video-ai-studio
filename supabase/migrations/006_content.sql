-- 006 — Contenido: nichos, CTA, proyectos, fuentes · docs/02-DATA-MODEL.md §6

create table niches (
  slug              text primary key,
  label             text not null,        -- en español, para la UI
  description       text,
  system_prompt     text not null,
  hook_patterns_json jsonb not null default '[]',
  is_active         boolean not null default true
);

create table cta_library (
  id                    uuid primary key default gen_random_uuid(),
  goal                  cta_goal not null,
  niche_slug            text references niches(slug),
  template              text not null,
  keyword_suggestions_json jsonb not null default '[]',
  is_active             boolean not null default true
);

create table projects (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  created_by     uuid not null references profiles(id),
  title          text,
  video_type     video_type not null,
  idea_prompt    text,                    -- lo que el usuario escribió en el chat
  niche_slug     text references niches(slug),
  brand_kit_id   uuid references brand_kits(id),
  template_id    uuid,
  avatar_id      uuid references avatars(id),
  avatar_look    text,
  avatar_model   text not null default 'avatar_iii',  -- registro histórico
  voice_id       uuid references voices(id),
  voice_mode     voice_mode not null default 'external_audio',
  voice_settings_json jsonb,              -- stability, similarity, style, speed
  aspect_ratio   text not null default '9:16',
  target_seconds integer not null default 50,
  status         project_status not null default 'draft',
  current_step   smallint not null default 1,
  final_asset_id uuid,
  editor_url     text,                    -- proyecto abierto en HyperFrames
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index on projects (workspace_id, created_at desc);
create index on projects (workspace_id, status);

create table input_sources (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references projects(id) on delete cascade,
  kind                    source_kind not null,
  url                     text,
  storage_path            text,
  platform                text,
  extracted_text          text,
  structure_analysis_json jsonb,
  raw_meta_json           jsonb,
  tokens_est              integer,
  status                  text not null default 'pending',
  error_code              text,
  created_at              timestamptz not null default now()
);

create index on input_sources (project_id);
