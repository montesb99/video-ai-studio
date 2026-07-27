-- 004 — Catálogos sincronizados · docs/02-DATA-MODEL.md §4

create table avatars (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider_id  text not null,             -- id en HeyGen
  name         text not null,
  thumb_url    text,
  looks_json   jsonb not null default '[]',
  synced_at    timestamptz not null default now(),
  unique (workspace_id, provider_id)
);

create table voices (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider_id  text not null,             -- voice_id en ElevenLabs
  name         text not null,
  is_cloned    boolean not null default false,
  category     text,                      -- 'professional' | 'instant' | 'premade'
  labels_json  jsonb not null default '{}',
  preview_url  text,
  synced_at    timestamptz not null default now(),
  unique (workspace_id, provider_id)
);

create index on voices (workspace_id, is_cloned desc);
