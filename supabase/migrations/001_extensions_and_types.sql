-- 001 — Extensiones y tipos · docs/02-DATA-MODEL.md §1

create extension if not exists "pgcrypto";
create extension if not exists "vector";  -- fase 3: búsqueda semántica de guiones

create type video_type       as enum ('informativo','reaccion','desde_enlace');
create type project_status   as enum (
  'draft','ingesting','ideating','scripting','voicing','styling',
  'visualizing','avatar','composing','ready','failed'
);
create type script_block     as enum ('hook','promise','content','cta');
create type scene_mode       as enum ('avatar','motion','mixto');
create type cta_goal         as enum ('leads','followers');
create type provider_name    as enum ('heygen','elevenlabs','openai','apify','meta');
create type integration_status as enum ('unverified','active','invalid','expired');
create type asset_kind       as enum (
  'logo','audio','avatar_video','final_video',
  'upload_image','upload_video','generated_image','music'
);
create type asset_source     as enum ('upload','generated','catalog');
create type music_style      as enum ('epic','corporate','tech_house','tension');
create type music_role       as enum ('intro','body');
create type social_platform  as enum ('instagram','tiktok');
create type media_type       as enum ('reel','carousel','image','video');
create type credit_reason    as enum ('purchase','hold','commit','refund','grant');
create type member_role      as enum ('owner','admin','editor','viewer');
create type source_kind      as enum ('text','link','social','pdf','image','audio');
create type assigned_by      as enum ('ai','user');
create type voice_mode       as enum ('external_audio','heygen_linked');
