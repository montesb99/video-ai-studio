-- 002 — Identidad y tenancy · docs/02-DATA-MODEL.md §2

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  avatar_url   text,
  locale       text not null default 'es',
  onboarded_at timestamptz,
  created_at   timestamptz not null default now()
);

create table workspaces (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references profiles(id) on delete restrict,
  name            text not null,
  plan            text not null default 'free',
  credits_balance integer not null default 0,   -- caché derivado del ledger
  created_at      timestamptz not null default now()
);

create table workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id      uuid not null references profiles(id)   on delete cascade,
  role         member_role not null default 'editor',
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index on workspace_members (user_id);

-- Infraestructura de Auth (no está en docs/02-DATA-MODEL.md porque no es
-- modelo de negocio): al registrarse un usuario, se crea su perfil, un
-- workspace propio como 'owner', y su membresía. Ver docs/04-UX-FLOWS.md —
-- el usuario nunca ve una pantalla de "crear workspace" en F1.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_workspace_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  insert into public.workspaces (owner_id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)) || ' · Workspace')
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (v_workspace_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
