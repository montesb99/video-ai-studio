# 02 — Modelo de datos · Video AI Studio

> Esquema Postgres completo, listo para migrar a Supabase, con políticas RLS.
> Última actualización: 25 jul 2026

---

## Principios

1. **RLS en toda tabla con `workspace_id`.** El aislamiento vive en Postgres, no en el código. Un bug de aplicación no puede filtrar datos entre clientes.
2. **El ledger de créditos es append-only.** Nunca un `UPDATE` sobre un saldo. Patrón `hold → commit | refund`. El saldo es derivable y auditable.
3. **`webhook_events.external_id` con UNIQUE.** Los proveedores reintentan webhooks; sin esto, se cobra doble.
4. **Nombres en inglés.** Tablas, columnas, enums. La UI va en español, el esquema no.
5. **Nada de secretos en claro.** Las claves BYOK y los tokens OAuth se guardan cifrados con AES-256-GCM.

---

## 1. Extensiones y tipos

```sql
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
```

> **`avatar_model`** se guarda por proyecto solo como **registro histórico**: con qué se generó cada video. La plataforma usa siempre **Avatar III**, fijado como constante en `lib/providers/heygen.ts`. No es parametrizable, no hay selector en la UI, y no se lee de la base de datos al generar. Existe la columna para poder migrar el día que HeyGen deprecie el modelo.
>
> **`voice_mode`** registra cuál de los dos caminos se usó: `external_audio` (nosotros generamos el audio, HeyGen hace lip-sync) o `heygen_linked` (HeyGen sintetiza contra la cuenta de ElevenLabs del usuario). Lo decide la plataforma, no el usuario.

---

## 2. Identidad y tenancy

```sql
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
```

> `credits_balance` es un **caché**. La verdad está en `credit_ledger`. Se recalcula en cada transacción del ledger dentro de la misma transacción SQL.

---

## 3. Integraciones (BYOK)

```sql
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
```

`linked_json` para `provider = 'elevenlabs'` registra si la clave quedó vinculada dentro de HeyGen:

```json
{
  "linkedToHeygen": true,
  "method": "api",
  "linkedAt": "2026-07-25T18:04:00Z",
  "clonedVoicesVisible": 2,
  "lastCheckedAt": "2026-07-25T18:04:00Z"
}
```

`scopes_json` para `provider = 'heygen'` cachea las capacidades detectadas al conectar, para no probarlas en cada video:

```json
{ "acceptsExternalAudio": true, "alphaBackground": true, "avatarModels": ["avatar_iii"] }
```

> **El secreto NUNCA se devuelve al cliente.** La API solo expone: proveedor, estado, `last_four` y `last_verified_at`. El descifrado ocurre exclusivamente en el runtime del job.

---

## 4. Catálogos sincronizados

```sql
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
```

> `is_cloned` ordena la UI: **Mis voces** primero, **Biblioteca** después.

---

## 5. Branding

```sql
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
```

---

## 6. Contenido

```sql
create table niches (
  slug              text primary key,
  label             text not null,        -- en español, para la UI
  description       text,
  system_prompt     text not null,
  hook_patterns_json jsonb not null default '[]',
  is_active         boolean not null default true
);

create table cta_library (
  id                    uuid primary key default gen_random_uuid(),
  goal                  cta_goal not null,
  niche_slug            text references niches(slug),
  template              text not null,
  keyword_suggestions_json jsonb not null default '[]',
  is_active             boolean not null default true
);
```

> El motor de CTA es **datos, no código**. Añadir patrones no requiere desplegar.
> **Palabra clave por defecto: `INNOVACION`** — la del creador, constante en todos sus videos. Variantes solo si el objetivo lo justifica (`BECA`, `FINANZAS`, o el nombre del producto en un anuncio). Regla: una sola palabra, mayúsculas y sin tildes **en pantalla**; minúscula y con tilde **en el texto hablado**.

```sql
create table projects (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references workspaces(id) on delete cascade,
  created_by     uuid not null references profiles(id),
  title          text,
  video_type     video_type not null,
  idea_prompt    text,                    -- lo que el usuario escribió en el chat
  niche_slug     text references niches(slug),
  brand_kit_id   uuid references brand_kits(id),
  template_id    uuid,
  avatar_id      uuid references avatars(id),
  avatar_look    text,
  avatar_model   text not null default 'avatar_iii',  -- registro histórico
  voice_id       uuid references voices(id),
  voice_mode     voice_mode not null default 'external_audio',
  voice_settings_json jsonb,              -- stability, similarity, style, speed
  aspect_ratio   text not null default '9:16',
  target_seconds integer not null default 50,
  status         project_status not null default 'draft',
  current_step   smallint not null default 1,
  final_asset_id uuid,
  editor_url     text,                    -- proyecto abierto en HyperFrames
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index on projects (workspace_id, created_at desc);
create index on projects (workspace_id, status);
```

```sql
create table input_sources (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references projects(id) on delete cascade,
  kind                    source_kind not null,
  url                     text,
  storage_path            text,
  platform                text,
  extracted_text          text,
  structure_analysis_json jsonb,
  raw_meta_json           jsonb,
  tokens_est              integer,
  status                  text not null default 'pending',
  error_code              text,
  created_at              timestamptz not null default now()
);

create index on input_sources (project_id);
```

> Una fila por adjunto del chat. La normalización a contexto único se hace al vuelo desde estas filas, para poder reprocesar sin re-subir.

```sql
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
```

```sql
create table scripts (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  idea_proposal_id  uuid references idea_proposals(id),
  version           smallint not null default 1,
  blocks_json       jsonb not null,   -- {hook, promise, content[], cta}
                                      -- cada bloque: { spoken, onScreen }
  word_count        integer,
  estimated_seconds numeric(5,2),
  is_confirmed      boolean not null default false,
  confirmed_at      timestamptz,
  model             text,
  created_at        timestamptz not null default now(),
  unique (project_id, version)
);

create unique index on scripts (project_id) where is_confirmed;
```

> Versionado: cada edición asistida crea una versión nueva. `is_confirmed` marca la única que pasa a producción. Permite "volver a la anterior".

⚠ **`blocks_json` separa `spoken` de `onScreen` por bloque. No es opcional.**

```json
{
  "hook": {
    "spoken":   "Si tienes un negocio en Perú y crees que la inteligencia artificial es cosa de empresas grandes, esto te va a doler.",
    "onScreen": { "titulo": "🏢 Las grandes ya tienen COMITÉ de IA ⚡", "fuente": null }
  },
  "content": [{
    "spoken":   "Mientras el veinticuatro por ciento de las grandes ya le asignó la supervisión...",
    "onScreen": { "dato": "24%", "etiqueta": "de las grandes ya tiene comité de IA",
                  "fuente": "EY Perú · AI & Boards 2026" }
  }],
  "cta": {
    "spoken":   "...Comenta innovación y te mando el acceso a mi comunidad.",
    "onScreen": { "palabraClave": "INNOVACION" }
  }
}
```

- **`spoken`** es lo único que llega a ElevenLabs, y va **ya normalizado para voz** (`veinticuatro por ciento`, no `24 %`; `inteligencia artificial`, no `IA`).
- **`onScreen`** lo pinta HyperFrames como tipografía real superpuesta.

Sin esta separación, el avatar **pronuncia en voz alta** las etiquetas de bloque y las citas de fuente. Se descubrió en el Spike 0. Ver [`07-METODOLOGIA-GUION.md`](07-METODOLOGIA-GUION.md) §3-bis.

```sql
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
```

> `audio_asset_id` y `caption_cues_json` se llenan en el **paso 4** (ElevenLabs), no en el 6. Regenerar un bloque de audio solo toca su fila.

---

## 7. Assets, slots y música

```sql
create table assets (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references workspaces(id) on delete cascade,
  project_id    uuid references projects(id) on delete cascade,
  kind          asset_kind not null,
  source        asset_source not null default 'upload',
  storage_path  text not null,
  mime          text not null,
  bytes         bigint,
  duration_ms   integer,
  width         integer,
  height        integer,
  checksum      text,
  analysis_json jsonb,     -- qué muestra, colores, si trae texto
  gen_prompt    text,      -- solo generated_image
  gen_model     text,
  created_at    timestamptz not null default now()
);

create index on assets (workspace_id, kind);
create index on assets (checksum);
create index on assets (gen_prompt) where kind = 'generated_image';
```

> `checksum` evita re-subir lo mismo. `gen_prompt` es la **clave de caché**: mismo bloque + mismo kit = misma imagen, sin volver a cobrar.

```sql
create table slot_assignments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  slot_id     text not null,       -- 'hook-bg', 'dato-1', 'broll-2'
  asset_id    uuid not null references assets(id) on delete cascade,
  assigned_by assigned_by not null default 'ai',
  confidence  numeric(3,2),
  reason      text,                -- "Sugerido para: Dato — 00:15"
  created_at  timestamptz not null default now(),
  unique (project_id, slot_id)
);
```

> **La IA propone, el usuario manda.** `assigned_by` distingue ambos, y `reason` es lo que se muestra en la UI.

```sql
create table music_tracks (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  style                music_style not null,
  block_role           music_role not null,
  video_types          video_type[] not null default '{}',
  bpm                  smallint,
  duration_ms          integer not null,
  storage_path         text not null,
  license              text not null,
  attribution_required boolean not null default false,
  source_url           text,
  is_active            boolean not null default true
);

create index on music_tracks (block_role, style) where is_active;
```

> **Solo pistas libres de derechos.** `license` y `source_url` quedan registrados por video para que la trazabilidad exista si alguna vez hay una reclamación.

**Mapa de música:**

| Tipo de video | Hook + Promesa (`intro`) | Contenido + CTA (`body`) |
|---|---|---|
| Informativo | `epic` | `corporate` |
| Reacción | `tension` | `tech_house` |
| Desde un enlace | heredado del análisis | heredado |

---

## 8. Plantillas

```sql
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
```

> **Añadir una plantilla NO requiere desplegar la app**: se sube, se registra su `hyperframes_asset_id` y su esquema, y aparece en el catálogo. Convierte "más formatos" en trabajo de contenido, no de ingeniería.

---

## 9. Ejecución

```sql
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

create table webhook_events (
  id           uuid primary key default gen_random_uuid(),
  provider     provider_name not null,
  external_id  text not null,
  payload      jsonb not null,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (provider, external_id)
);
```

> `unique (provider, external_id)` **es la idempotencia**. Un webhook duplicado no puede cobrar dos veces ni duplicar assets.

---

## 10. Analítica de publicaciones

```sql
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
```

> `post_metrics` es una **serie temporal** (una fila por captura), no un `UPDATE` sobre la publicación. Permite curvas de crecimiento y comparar periodos.
>
> `publications.project_id` es **nullable**: el usuario puede publicar videos que no generó aquí. Ese enlace es lo que responde *"¿qué nicho y qué gancho me rinden?"* y realimenta el generador de guiones.

---

## 11. Comercial y auditoría

```sql
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
```

### Patrón hold → commit | refund

```sql
create or replace function credits_move(
  p_workspace uuid, p_delta integer, p_reason credit_reason, p_project uuid
) returns integer language plpgsql security definer as $$
declare v_balance integer;
begin
  select credits_balance into v_balance
    from workspaces where id = p_workspace for update;

  if p_reason = 'hold' and v_balance + p_delta < 0 then
    raise exception 'insufficient_credits';
  end if;

  v_balance := v_balance + p_delta;
  update workspaces set credits_balance = v_balance where id = p_workspace;

  insert into credit_ledger (workspace_id, delta, reason, project_id, balance_after)
  values (p_workspace, p_delta, p_reason, p_project, v_balance);

  return v_balance;
end $$;
```

`SELECT ... FOR UPDATE` serializa las operaciones concurrentes sobre el mismo workspace. Sin eso, dos renders simultáneos pueden gastar el mismo crédito.

---

## 12. Row Level Security

```sql
-- Helper: workspaces a los que pertenece el usuario actual
create or replace function current_workspaces() returns setof uuid
language sql stable security definer as $$
  select workspace_id from workspace_members where user_id = auth.uid();
$$;
```

### Patrón general

Se aplica a: `projects`, `input_sources`, `idea_proposals`, `scripts`, `scenes`, `assets`, `slot_assignments`, `brand_kits`, `avatars`, `voices`, `integrations`, `render_jobs`, `social_accounts`, `publications`, `credit_ledger`, `audit_log`.

```sql
alter table projects enable row level security;

create policy projects_select on projects for select
  using (workspace_id in (select current_workspaces()));

create policy projects_insert on projects for insert
  with check (workspace_id in (select current_workspaces()));

create policy projects_update on projects for update
  using (workspace_id in (select current_workspaces()))
  with check (workspace_id in (select current_workspaces()));

create policy projects_delete on projects for delete
  using (workspace_id in (select current_workspaces()));
```

### Tablas hijas sin `workspace_id` propio

```sql
alter table scenes enable row level security;

create policy scenes_all on scenes for all
  using (
    exists (
      select 1 from projects p
      where p.id = scenes.project_id
        and p.workspace_id in (select current_workspaces())
    )
  );
```

### Tablas globales (solo lectura)

```sql
alter table niches        enable row level security;
alter table cta_library   enable row level security;
alter table templates     enable row level security;
alter table music_tracks  enable row level security;

create policy niches_read       on niches       for select using (is_active);
create policy cta_read          on cta_library  for select using (is_active);
create policy templates_read    on templates    for select using (is_active);
create policy music_read        on music_tracks for select using (is_active);
```

### Nunca accesibles desde el cliente

`webhook_events`, `subscriptions` y el descifrado de `integrations` solo se tocan con la **service role key**, desde el servidor.

```sql
alter table webhook_events enable row level security;
-- sin políticas = nadie con anon/authenticated puede leerlas
```

### Test de RLS obligatorio en CI

```sql
-- Debe devolver 0 filas: usuario A no puede ver proyectos de workspace B
set local role authenticated;
set local request.jwt.claims to '{"sub":"<user-a-uuid>"}';
select count(*) from projects where workspace_id = '<workspace-b-uuid>';
-- esperado: 0
```

---

## 13. Triggers

```sql
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger projects_touch before update on projects
  for each row execute function touch_updated_at();
```

---

## 14. Orden de migración

```
001_extensions_and_types.sql
002_identity_and_tenancy.sql
003_integrations.sql
004_catalogs.sql            -- avatars, voices
005_branding.sql
006_content.sql             -- niches, cta_library, projects, input_sources
007_scripts_and_scenes.sql  -- idea_proposals, scripts, scenes
008_assets_and_music.sql    -- assets, slot_assignments, music_tracks
009_templates.sql
010_execution.sql           -- render_jobs, webhook_events
011_analytics.sql           -- social_accounts, publications, post_metrics
012_commerce.sql            -- credit_ledger, subscriptions, audit_log
013_functions.sql           -- credits_move, current_workspaces, triggers
014_rls_policies.sql
015_seed.sql                -- niches, cta_library, music_tracks
```
