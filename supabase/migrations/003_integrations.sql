-- 003 — Integraciones (BYOK) · docs/02-DATA-MODEL.md §3

create table integrations (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references workspaces(id) on delete cascade,
  provider          provider_name not null,
  ciphertext        bytea not null,       -- AES-256-GCM
  iv                bytea not null,
  auth_tag          bytea not null,
  key_version       smallint not null default 1,
  last_four         text,                 -- para mostrar en la UI
  status            integration_status not null default 'unverified',
  last_verified_at  timestamptz,
  scopes_json       jsonb,      -- capacidades detectadas (¿acepta audio externo?)
  linked_json       jsonb,      -- vinculación con otro proveedor
  created_at        timestamptz not null default now(),
  unique (workspace_id, provider)
);
