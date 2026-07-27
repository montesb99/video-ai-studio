-- 012 — Comercial y auditoría · docs/02-DATA-MODEL.md §11

create table credit_ledger (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  delta         integer not null,
  reason        credit_reason not null,
  project_id    uuid references projects(id) on delete set null,
  balance_after integer not null,
  meta_json     jsonb,
  created_at    timestamptz not null default now()
);

create index on credit_ledger (workspace_id, created_at desc);

create table subscriptions (
  workspace_id       uuid primary key references workspaces(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_sub_id      text,
  plan               text not null,
  status             text not null,
  period_end         timestamptz
);

create table audit_log (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  actor_id     uuid references profiles(id),
  action       text not null,
  target       text,
  meta_json    jsonb,
  ip           inet,
  created_at   timestamptz not null default now()
);
