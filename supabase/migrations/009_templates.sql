-- 009 — Plantillas · docs/02-DATA-MODEL.md §8

create table templates (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  name                  text not null,
  video_type            video_type not null,
  aspect_ratio          text not null default '9:16',
  version               smallint not null default 1,
  hyperframes_asset_id  text not null,   -- "upload once, re-render many"
  variables_schema_json jsonb not null,
  slots_json            jsonb not null,  -- [{id, role, aspect, kind, block}]
  beats_json            jsonb not null,  -- ritmo: cambio visual cada <= 8 s
  music_map_json        jsonb not null,
  thumb_url             text,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now()
);

alter table projects add constraint projects_template_id_fkey
  foreign key (template_id) references templates(id);
