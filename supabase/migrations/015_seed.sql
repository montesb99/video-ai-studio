-- 015 — Seed · docs/02-DATA-MODEL.md §14, etiquetas de docs/06-COPY-ES.md §4
-- music_tracks se puebla en el Sprint 4 (depende del catálogo de música
-- libre de derechos que confirme el usuario) — no se inventan pistas aquí.

insert into niches (slug, label, description, system_prompt) values
  ('finanzas',    'Finanzas',       null, 'Placeholder — se refina en el Sprint 3 con la metodología real de docs/07-METODOLOGIA-GUION.md.'),
  ('ia-tech',     'IA y Tecnología', null, 'Placeholder — se refina en el Sprint 3 con la metodología real de docs/07-METODOLOGIA-GUION.md.'),
  ('salud',       'Salud',          null, 'Placeholder — se refina en el Sprint 3 con la metodología real de docs/07-METODOLOGIA-GUION.md.'),
  ('fitness',     'Fitness',        null, 'Placeholder — se refina en el Sprint 3 con la metodología real de docs/07-METODOLOGIA-GUION.md.'),
  ('marketing',   'Marketing',      null, 'Placeholder — se refina en el Sprint 3 con la metodología real de docs/07-METODOLOGIA-GUION.md.'),
  ('mentalidad',  'Mentalidad',     null, 'Placeholder — se refina en el Sprint 3 con la metodología real de docs/07-METODOLOGIA-GUION.md.'),
  ('cripto',      'Cripto',         null, 'Placeholder — se refina en el Sprint 3 con la metodología real de docs/07-METODOLOGIA-GUION.md.'),
  ('inmobiliario','Bienes Raíces',  null, 'Placeholder — se refina en el Sprint 3 con la metodología real de docs/07-METODOLOGIA-GUION.md.'),
  ('educacion',   'Educación',      null, 'Placeholder — se refina en el Sprint 3 con la metodología real de docs/07-METODOLOGIA-GUION.md.'),
  ('ecommerce',   'E-commerce',     null, 'Placeholder — se refina en el Sprint 3 con la metodología real de docs/07-METODOLOGIA-GUION.md.');

-- Palabra clave por defecto: INNOVACION (docs/00-PRD.md, docs/07-METODOLOGIA-GUION.md).
-- Mayúsculas y sin tildes en pantalla; minúscula y con tilde en el texto hablado.
insert into cta_library (goal, niche_slug, template, keyword_suggestions_json) values
  ('leads', null, 'Comenta {keyword} y te mando el acceso a mi comunidad.', '["INNOVACION"]'),
  ('followers', null, 'Sígueme, mañana subo la parte 2.', '[]');
