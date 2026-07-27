-- 011 — Analítica de publicaciones · docs/02-DATA-MODEL.md §10

create table social_accounts (
  id                     uuid primary key default gen_random_uuid(),
  workspace_id           uuid not null references workspaces(id) on delete cascade,
  platform               social_platform not null,
  external_user_id       text not null,
  handle                 text not null,
  avatar_url             text,
  access_token_ciphertext bytea not null,
  iv                     bytea not null,
  auth_tag               bytea not null,
  key_version            smallint not null default 1,
  token_expires_at       timestamptz,
  status                 integration_status not null default 'active',
  connected_at           timestamptz not null default now(),
  last_synced_at         timestamptz,
  unique (workspace_id, platform, external_user_id)
);

create table publications (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  project_id        uuid references projects(id) on delete set null,
  social_account_id uuid not null references social_accounts(id) on delete cascade,
  external_post_id  text not null,
  permalink         text,
  media_type        media_type not null,
  caption           text,
  thumb_url         text,
  published_at      timestamptz not null,
  unique (social_account_id, external_post_id)
);

create index on publications (workspace_id, published_at desc);

create table post_metrics (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid not null references publications(id) on delete cascade,
  captured_at     timestamptz not null default now(),
  views           integer, reach    integer,
  likes           integer, comments integer,
  shares          integer, saves    integer,
  follows         integer,
  engagement_rate numeric(5,2)
);

create index on post_metrics (publication_id, captured_at desc);
