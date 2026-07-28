-- 018 — Perfiles reales de nicho (Capa 2) · docs/07-METODOLOGIA-GUION.md §4
-- Reemplaza el placeholder de 015_seed.sql ("se refina en el Sprint 3") por
-- tono, vocabulario, jerarquía de fuentes (§3.6) y patrones de hook por
-- nicho. Content-work de producto apoyado en la metodología base — 015_seed
-- ya prometía este refinamiento explícitamente en este sprint.

update niches set
  system_prompt = $$Tono cercano pero riguroso, sin jerga de bróker ni promesas de rentabilidad garantizada. Vocabulario: ahorro, presupuesto, deuda, interés compuesto, sueldo. Fuentes prioritarias: BCRP, INEI, SBS, Gestión, ComexPerú. Ejemplos hiperlocales cuando el material lo permita (sueldo mínimo, alquiler en Lima, gastos de una pyme).$$,
  hook_patterns_json = '[
    {"patron": "contraste_temporal", "ejemplo": "Hace 5 años {X} rendía {A}%. Hoy rinde {B}%."},
    {"patron": "error_comun", "ejemplo": "El 80% guarda su dinero así. Y así pierde plata cada mes."}
  ]'
where slug = 'finanzas';

update niches set
  system_prompt = $$Tono directo, sin exagerar el impacto de una herramienta nueva ni caer en tecno-optimismo vacío. Vocabulario: modelo, automatización, flujo de trabajo, agente. Fuentes prioritarias: MIT Technology Review, WEF, McKinsey, Statista, DataReportal.$$,
  hook_patterns_json = '[
    {"patron": "contraste_temporal", "ejemplo": "Hace 6 meses esto costaba {X}. Hoy cuesta {Y}."},
    {"patron": "error_comun", "ejemplo": "El 90% usa {herramienta} mal. Y es por esto."},
    {"patron": "dato_inesperado", "ejemplo": "{Empresa} despidió a {N} personas y facturó más."}
  ]'
where slug = 'ia-tech';

update niches set
  system_prompt = $$Tono cuidadoso, nunca alarmista, cada afirmación respaldada por un estudio citable. Prohibido dar diagnóstico o indicación médica directa — siempre "consultá con un profesional" cuando el contenido roce eso. Vocabulario simple, sin tecnicismos sin explicar. Fuentes prioritarias: estudios revisados por pares, PubMed, Nature/Science, OMS, MINSA.$$,
  hook_patterns_json = '[
    {"patron": "mito_comun", "ejemplo": "Te dijeron que {mito}. La evidencia dice lo contrario."},
    {"patron": "dato_inesperado", "ejemplo": "Un estudio con {N} personas encontró algo que nadie esperaba sobre {tema}."}
  ]'
where slug = 'salud';

update niches set
  system_prompt = $$Tono motivador pero realista — sin prometer resultados mágicos ni transformaciones en una semana. Vocabulario: rutina, progreso, constancia, técnica. Prioriza el "por qué" fisiológico simple por sobre la anécdota. Fuentes: estudios de entrenamiento, casos reales verificables.$$,
  hook_patterns_json = '[
    {"patron": "error_comun", "ejemplo": "Llevás meses haciendo {ejercicio} así. Por eso no avanzás."},
    {"patron": "contraste_antes_despues", "ejemplo": "Cambié solo {X} y esto pasó en {N} semanas."}
  ]'
where slug = 'fitness';

update niches set
  system_prompt = $$Tono práctico, orientado a resultados medibles — nada de buzzwords vacíos ("sinergia", "disruptivo"). Vocabulario: conversión, embudo, alcance, retención. Siempre con un número o caso concreto detrás de la afirmación. Fuentes: Statista, DataReportal, casos reales de marcas.$$,
  hook_patterns_json = '[
    {"patron": "dato_inesperado", "ejemplo": "Esta marca gastó {X} en ads y facturó {Y}. Así lo hizo."},
    {"patron": "error_comun", "ejemplo": "El error que comete el 70% al lanzar una campaña."}
  ]'
where slug = 'marketing';

update niches set
  system_prompt = $$Tono cercano y reflexivo, primera persona o segunda persona directa — nunca frases motivacionales genéricas de póster. Siempre parte de un caso concreto (propio o de una historia real), nunca de una afirmación abstracta suelta. Vocabulario simple, sin jerga de autoayuda.$$,
  hook_patterns_json = '[
    {"patron": "contraste_temporal", "ejemplo": "Hace {N} años pensaba que {creencia}. Hoy sé que {realidad}."},
    {"patron": "revelacion_personal", "ejemplo": "Nadie me dijo esto sobre {tema} hasta que ya era tarde."}
  ]'
where slug = 'mentalidad';

update niches set
  system_prompt = $$Tono escéptico-informativo — nunca da consejo de inversión directo ni promete rentabilidad. Vocabulario: volatilidad, regulación, wallet, exchange. Siempre distingue entre dato verificable y especulación de mercado. Fuentes: informes de mercado citables, marcos regulatorios (BCRP/SBS para el contexto peruano).$$,
  hook_patterns_json = '[
    {"patron": "alerta", "ejemplo": "Esto que está pasando con {activo} le pasó antes a {precedente}."},
    {"patron": "contraste_mercado", "ejemplo": "Mientras todos hablan de {tendencia}, esto es lo que dicen los números."}
  ]'
where slug = 'cripto';

update niches set
  system_prompt = $$Tono local y práctico, orientado a una decisión concreta (comprar, alquilar, invertir). Vocabulario: plusvalía, cuota inicial, m2, zonificación. Ejemplos con zonas/distritos reales cuando el material lo permita. Fuentes: INEI, cámaras inmobiliarias, reportes de mercado local.$$,
  hook_patterns_json = '[
    {"patron": "contraste_precio", "ejemplo": "En {zona} el m2 costaba {X} hace {N} años. Hoy cuesta {Y}."},
    {"patron": "error_comun", "ejemplo": "El error que comete la mayoría al firmar su primer contrato de alquiler."}
  ]'
where slug = 'inmobiliario';

update niches set
  system_prompt = $$Tono claro y paciente, sin condescendencia — explica como a alguien inteligente que simplemente no conoce el tema todavía. Vocabulario simple, define cualquier término técnico la primera vez que aparece. Fuentes: estudios educativos, casos de instituciones reales.$$,
  hook_patterns_json = '[
    {"patron": "mito_comun", "ejemplo": "Te enseñaron que {mito} funciona. Los datos dicen otra cosa."},
    {"patron": "dato_inesperado", "ejemplo": "Un estudio siguió a {N} estudiantes y encontró esto sobre {método}."}
  ]'
where slug = 'educacion';

update niches set
  system_prompt = $$Tono práctico, orientado a la operación real de una tienda online — ventas, logística, atención al cliente. Vocabulario: ticket promedio, carrito abandonado, conversión, fulfillment. Siempre con un número o caso concreto de tienda real. Fuentes: Statista, casos de tiendas verificables.$$,
  hook_patterns_json = '[
    {"patron": "error_comun", "ejemplo": "El 60% de los carritos se abandonan por esto. Y se arregla fácil."},
    {"patron": "dato_inesperado", "ejemplo": "Esta tienda cambió {X} en su checkout y subió {Y}% las ventas."}
  ]'
where slug = 'ecommerce';
