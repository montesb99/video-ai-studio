-- 007 — Propuestas, guiones y escenas · docs/02-DATA-MODEL.md §6

create table idea_proposals (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  index             smallint not null,
  approach          text not null,   -- storytelling_informativo | reaccion_informativa | dato_duro
  hook_title        text not null,
  description       text not null,
  why_it_works      text not null,
  virality_score    smallint not null check (virality_score between 0 and 100),
  virality_reason   text,
  cta_goal          cta_goal not null,
  cta_text          text not null,
  cta_keyword       text,
  estimated_seconds smallint not null default 50,
  is_selected       boolean not null default false,
  model             text,
  tokens_used       integer,
  created_at        timestamptz not null default now(),
  unique (project_id, index)
);

create unique index on idea_proposals (project_id) where is_selected;

-- ⚠ blocks_json separa `spoken` de `onScreen` por bloque — no es opcional.
-- Ver docs/07-METODOLOGIA-GUION.md §3-bis: sin esta separación el avatar
-- pronuncia en voz alta las etiquetas de bloque y las citas de fuente.
create table scripts (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  idea_proposal_id  uuid references idea_proposals(id),
  version           smallint not null default 1,
  blocks_json       jsonb not null,   -- {hook, promise, content[], cta} — cada bloque: {spoken, onScreen}
  word_count        integer,
  estimated_seconds numeric(5,2),
  is_confirmed      boolean not null default false,
  confirmed_at      timestamptz,
  model             text,
  created_at        timestamptz not null default now(),
  unique (project_id, version)
);

create unique index on scripts (project_id) where is_confirmed;

create table scenes (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(id) on delete cascade,
  script_id        uuid not null references scripts(id) on delete cascade,
  index            smallint not null,
  block            script_block not null,
  mode             scene_mode not null default 'avatar',
  text             text not null,
  duration_est     numeric(5,2),
  start_at         numeric(6,2),
  audio_asset_id   uuid,
  caption_cues_json jsonb,            -- [{w, t0, t1}] ← tiempos de ElevenLabs
  slot_id          text,
  transition       text,
  beats_json       jsonb,             -- cambio visual cada <= 8 s
  created_at       timestamptz not null default now(),
  unique (project_id, index)
);
