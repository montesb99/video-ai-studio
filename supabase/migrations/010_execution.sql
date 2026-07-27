-- 010 — Ejecución: render jobs y webhooks · docs/02-DATA-MODEL.md §9

create table render_jobs (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  step          text not null,
  status        text not null default 'pending',
  provider      provider_name,
  external_id   text,
  request_json  jsonb,
  response_json jsonb,
  error_code    text,
  error_message text,
  attempt       smallint not null default 1,
  credits_held  integer not null default 0,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now()
);

create index on render_jobs (project_id, created_at desc);
create index on render_jobs (external_id) where external_id is not null;

-- unique (provider, external_id) es la idempotencia: un webhook duplicado
-- no puede cobrar dos veces ni duplicar assets.
create table webhook_events (
  id           uuid primary key default gen_random_uuid(),
  provider     provider_name not null,
  external_id  text not null,
  payload      jsonb not null,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (provider, external_id)
);
