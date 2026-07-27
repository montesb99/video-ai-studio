-- 005 — Branding · docs/02-DATA-MODEL.md §5

create table brand_kits (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null references workspaces(id) on delete cascade,
  name                text not null,
  is_default          boolean not null default false,
  colors_json         jsonb not null,     -- {primary, secondary, accent}
  logo_asset_id       uuid,
  watermark_position  text not null default 'top-right',
  font_family         text not null default 'Inter',
  subtitle_style      text not null default 'karaoke',  -- karaoke|block|pop
  subtitle_highlight  text not null default '#FFD400',
  created_at          timestamptz not null default now()
);

create unique index on brand_kits (workspace_id) where is_default;
