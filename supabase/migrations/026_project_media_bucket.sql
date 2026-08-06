-- 026 — Bucket privado de media de proyecto (audio + avatar) · Sprint 4
--
-- Primera migración del repo que toca Supabase Storage — sin precedente en
-- 001-025, así que el diseño de acá fija el patrón para cualquier bucket
-- futuro (thumbnails, exports finales, etc.).
--
-- project-media guarda dos tipos de archivo generados por el pipeline, nunca
-- subidos directo por el usuario: el audio final concatenado (voz aprobada,
-- ElevenLabs) y el video del avatar (HeyGen). Convención de ruta, aplicada
-- por el código de la app (Server Actions) al momento de subir, no por un
-- constraint de columna — mismo criterio que assets.storage_path o
-- input_sources.storage_path (008/006), que tampoco validan formato a nivel
-- de DB:
--   {workspace_id}/{project_id}/audio/<archivo>
--   {workspace_id}/{project_id}/avatar/<archivo>
--
-- Privado (public = false): estos archivos nunca se sirven por URL pública
-- fija. El navegador los consume vía signed URL de corta duración, generada
-- desde un Server Action con el CLIENTE DE SESIÓN del usuario (lib/supabase/
-- server.ts) — no con lib/supabase/service.ts. Supabase respeta RLS de
-- storage.objects también al firmar URLs con el cliente de sesión, así que
-- las policies de abajo bastan solas; no hace falta ningún camino con
-- service role para este flujo. service.ts queda reservado para lo que ya
-- documenta su propio comentario (prompt_profiles, sin RLS por diseño,
-- 016_prompt_profiles.sql) — mezclar ambos usos ahí sería exactamente la
-- clase de atajo que termina rompiendo el aislamiento por workspace.
--
-- file_size_limit/allowed_mime_types: defensa en profundidad, no la única
-- barrera — docs/01-ARCHITECTURE.md §8 ("Archivos subidos maliciosos: tipo
-- real por magic bytes, límites de tamaño"). 200 MB da margen sobre los
-- ~37.6 MB medidos para un avatar de 50s (mismo doc, §11-bis).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-media', 'project-media', false, 209715200,
  array['audio/wav', 'audio/mpeg', 'audio/mp4', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

-- Sin `alter table storage.objects enable row level security` acá: esa
-- tabla ya viene con RLS activado por defecto en todo proyecto Supabase, y
-- el rol con el que corre el SQL Editor no es dueño de esa tabla (la
-- administra un rol interno de Supabase) — intentar reactivarlo falla con
-- `42501: must be owner of table objects`. Las policies de abajo alcanzan
-- solas.

-- El primer segmento de la ruta es el workspace_id. Se compara como TEXT
-- contra current_workspaces() (013_functions.sql, security definer, no se
-- redefine acá) en vez de castear el segmento de ruta a ::uuid: castear un
-- fragmento no confiable de storage.objects.name puede reventar con una
-- excepción si algún día otro bucket con una convención de ruta distinta
-- comparte esta misma tabla y Postgres evalúa esta policy sobre esa fila —
-- el planner no garantiza el orden de evaluación de un AND, así que
-- `bucket_id = 'project-media' and (...)::uuid ...` no protege el cast.
-- Comparando como texto, una ruta cuyo primer segmento no sea un uuid
-- simplemente no matchea — nunca lanza.
create policy project_media_select on storage.objects for select
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] in (select cw::text from current_workspaces() cw)
  );

create policy project_media_insert on storage.objects for insert
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] in (select cw::text from current_workspaces() cw)
  );

create policy project_media_update on storage.objects for update
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] in (select cw::text from current_workspaces() cw)
  )
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] in (select cw::text from current_workspaces() cw)
  );

create policy project_media_delete on storage.objects for delete
  using (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] in (select cw::text from current_workspaces() cw)
  );
