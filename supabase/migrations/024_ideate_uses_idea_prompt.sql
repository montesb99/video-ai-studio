-- 024 — El prompt de ideación reconoce idea_prompt como entrada principal
--
-- La v1 de task/ideate (017_prompt_profiles_seed.sql) asumía que el contexto
-- de <fuentes> era la ÚNICA entrada ("a partir del contexto de fuentes y el
-- nicho"), porque hasta ahora la casilla de texto de la pantalla de idea
-- SE GUARDABA como una fuente más (input_sources kind='text'), nunca en
-- projects.idea_prompt (esa columna existía en el schema desde 006_content.sql
-- pero nunca se leía ni escribía — ver app/(app)/create/[projectId]/shared.ts).
--
-- El rediseño de UX de la pantalla de idea separa las dos cosas: una casilla
-- de idea obligatoria (guardada en projects.idea_prompt) y fuentes adjuntas
-- opcionales (input_sources, puede no haber ninguna). runGenerateProposals
-- ahora envía "Idea del usuario: ..." siempre presente, más <fuentes></fuentes>
-- vacío cuando no hay adjuntos — sin este ajuste al prompt, el modelo seguía
-- instruido a esperar el material únicamente en fuentes y podía ignorar o
-- confundirse con el bloque de idea del usuario.
insert into prompt_profiles (layer, key, version, content, is_active) values
('task', 'ideate', 2, $$Generá exactamente 3 propuestas de video a partir de la idea del usuario — siempre presente, es la entrada principal — y, si las hay, las fuentes adjuntas como contexto complementario (pueden no existir; no asumas que faltan datos si no hay ninguna, trabajá con la idea del usuario sola).

Regla de diversidad: las 3 propuestas deben cubrir ángulos distintos del mismo material, no 3 variaciones del mismo ángulo. Si el material solo da para un ángulo, decilo en "avisos" y generá variantes de tono, no de ángulo.

Cada propuesta trae: enfoque (approach), gancho (hookTitle, máx 90 caracteres), descripción (2-3 frases), porQueFunciona (whyItWorks, 1-2 frases con razón concreta), viralidad {puntaje 0-100, razon} — el puntaje SIEMPRE lleva su razón explicada, nunca es un número sin justificar, es una heurística explicada, no una predicción.

Si no hay ningún dato verificable que respalde una afirmación (idea corta, sin fuentes adjuntas), basá porQueFunciona y viralidad.razon en mecanismos de enganche (formato, curiosidad, identificación, estructura del gancho) — nunca en una cifra o estudio inventado. Inventar un dato para sonar más convincente es peor que una razón honesta sin cifra.

CTA: elegilo según el objetivo, nunca lo improvises. "leads" (palabra clave en comentarios) cuando el tema permite entregar algo — sistema, plantilla, guía. "followers" (promesa de continuidad) cuando el tema es informativo puro, sin entregable. La palabra clave por defecto es INNOVACION; usá una palabra del vocabulario del nicho (IA, AUTOMATIZA, AGENTE, BOT, SISTEMA, PLANTILLA, GPT, FLUJO) solo si el contenido concreto de esa propuesta la justifica — nunca "IA" genérico si el video habla específicamente de agentes, ahí la palabra es "AGENTE". La palabra clave siempre: una sola palabra, mayúsculas, sin tildes.

Si el proyecto no tiene nicho asignado todavía, detectalo de la idea del usuario y, si hay, del contexto de fuentes, y devolvelo como campo adicional nicho_detectado.$$, false);

update prompt_profiles set is_active = false where layer = 'task' and key = 'ideate' and version = 1;
update prompt_profiles set is_active = true where layer = 'task' and key = 'ideate' and version = 2;
