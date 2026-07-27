# 06 — Copy deck en español · Video AI Studio

> Fuente de verdad de todos los textos de la interfaz. Alimenta `messages/es.json` y el prompt maestro de diseño.
> Última actualización: 25 jul 2026

---

## Principios de voz

1. **Segunda persona, tuteo.** "Escribe tu idea", no "Escriba su idea" ni "El usuario debe escribir".
2. **Verbos de acción, no sustantivos.** "Crear video", no "Creación de video".
3. **Decimos qué pasa, no qué falló.** "No pudimos leer ese enlace" en vez de "Error 422".
4. **Nada de espanglish innecesario.** Pero sí conservamos lo que el usuario ya conoce en inglés: *reel*, *hook*, *storyboard*, *branding*, *look*. Traducirlos empeora la comprensión.
5. **Sin signos de exclamación.** El producto es una herramienta, no un anuncio.
6. **Números en formato local:** `8.420`, `7,3 %`, `0:50`, `18 jul`.
7. **Tildes siempre, también en mayúsculas:** `EDUCACIÓN`, no `EDUCACION`.

---

## 1. Navegación

```json
{
  "nav.home": "Inicio",
  "nav.create": "Crear video",
  "nav.library": "Biblioteca",
  "nav.brand": "Identidad de marca",
  "nav.templates": "Plantillas",
  "nav.integrations": "Integraciones",
  "nav.settings": "Ajustes",
  "nav.credits": "Créditos",
  "nav.upgrade.title": "Plan Premium",
  "nav.upgrade.body": "Desbloquea todas las plantillas y más créditos.",
  "nav.upgrade.cta": "Mejorar plan"
}
```

## 2. Stepper del wizard

```json
{
  "step.1": "Idea",
  "step.2": "Propuestas",
  "step.3": "Guion",
  "step.4": "Voz",
  "step.5": "Avatar y marca",
  "step.6": "Escenas"
}
```

---

## 3. Panel de rendimiento

```json
{
  "dash.title": "Rendimiento",
  "dash.subtitle": "Tus publicaciones en Instagram · últimos 30 días",
  "dash.range.7": "Últimos 7 días",
  "dash.range.30": "Últimos 30 días",
  "dash.range.90": "Últimos 90 días",
  "dash.create": "+ Crear video",

  "kpi.views": "Reproducciones",
  "kpi.interactions": "Interacciones",
  "kpi.reach": "Alcance",
  "kpi.newFollowers": "Nuevos seguidores",
  "kpi.engagementRate": "Tasa de interacción",

  "chart.title": "Evolución",
  "chart.views": "Reproducciones",
  "chart.interactions": "Interacciones",

  "posts.title": "Publicaciones",
  "posts.filter.all": "Todas",
  "posts.filter.reels": "Reels",
  "posts.filter.carousels": "Carruseles",
  "posts.metric.views": "Repr.",
  "posts.metric.likes": "Me gusta",
  "posts.metric.comments": "Coment.",
  "posts.metric.saves": "Guardados",
  "posts.badge.top": "Top",

  "best.title": "Mejor rendimiento",
  "accounts.title": "Cuentas conectadas",
  "accounts.connected": "Conectado",
  "accounts.notConnected": "Sin conectar",

  "dash.empty.title": "Todavía no vemos tus métricas",
  "dash.empty.body": "Conecta tu Instagram para ver cómo rinde tu contenido.",
  "dash.empty.cta": "Conectar Instagram",
  "dash.noPosts.title": "Aún no hay publicaciones",
  "dash.noPosts.body": "Cuando publiques tu primer video, sus métricas aparecen aquí.",
  "dash.syncing": "Actualizando métricas...",
  "dash.stale": "Última actualización: hace {time}"
}
```

---

## 4. Paso 1 — Idea

```json
{
  "idea.title": "¿Qué quieres contar hoy?",
  "idea.subtitle": "Elige el formato, escribe tu idea y adjunta lo que tengas.",

  "type.informativo.title": "Informativo",
  "type.informativo.desc": "Explica una idea rápido y claro",
  "type.reaccion.title": "Reacción",
  "type.reaccion.desc": "Reacciona a una tendencia",
  "type.enlace.title": "Desde un enlace",
  "type.enlace.desc": "Copia la estructura de un video que te gusta",

  "idea.placeholder": "Escribe tu idea. Por ejemplo: quiero explicar cómo la IA está reemplazando tareas repetitivas en negocios pequeños del Perú.",
  "idea.attach.file": "Adjuntar archivo",
  "idea.attach.link": "Pegar enlace",
  "idea.attach.image": "Imagen",
  "idea.attach.voice": "Nota de voz",
  "idea.sources": "{count, plural, =0 {Sin fuentes} =1 {1 fuente} other {# fuentes}}",
  "idea.linkRequired": "Pega el enlace del video que quieres usar como referencia.",

  "niche.title": "Nicho",
  "niche.autoDetected": "Detectado automáticamente",

  "idea.submit": "Generar ideas →",
  "idea.free": "Gratis · no consume créditos",

  "source.processing": "Procesando...",
  "source.ready": "Listo",
  "source.failed": "No pudimos leer este archivo",
  "source.tooMuch": "Mucho material. Resumiremos las fuentes más largas."
}
```

### Nichos

```json
{
  "niche.finanzas": "Finanzas",
  "niche.ia-tech": "IA y Tecnología",
  "niche.salud": "Salud",
  "niche.fitness": "Fitness",
  "niche.marketing": "Marketing",
  "niche.mentalidad": "Mentalidad",
  "niche.cripto": "Cripto",
  "niche.inmobiliario": "Bienes Raíces",
  "niche.educacion": "Educación",
  "niche.ecommerce": "E-commerce"
}
```

---

## 5. Paso 2 — Propuestas

```json
{
  "proposals.title": "Elige tu idea",
  "proposals.subtitle": "3 propuestas para {niche} · {type}",
  "proposals.subtitleWithSources": "3 propuestas para {niche} · basadas en tus {count} fuentes",

  "proposal.label": "Propuesta {letter}",
  "proposal.hook": "GANCHO",
  "proposal.idea": "LA IDEA",
  "proposal.why": "POR QUÉ FUNCIONA",
  "proposal.cta": "CTA SUGERIDO",
  "proposal.virality": "Viralidad",
  "proposal.duration": "{seconds} s",
  "proposal.words": "≈ {count} palabras",

  "approach.storytelling": "Storytelling informativo",
  "approach.reaccion": "Reacción informativa",
  "approach.dato": "Dato duro",

  "cta.goal.leads": "Leads",
  "cta.goal.followers": "Seguidores",

  "proposals.regenerate": "Generar otras 3",
  "proposals.continue": "Escribir guion →"
}
```

---

## 6. Paso 3 — Guion

```json
{
  "script.title": "Tu guion",
  "script.subtitle": "{seconds} segundos · 4 bloques · editable",

  "block.hook": "HOOK",
  "block.promise": "PROMESA",
  "block.content": "CONTENIDO",
  "block.cta": "CTA FINAL",

  "assist.shorten": "Acortar",
  "assist.direct": "Más directo",
  "assist.tension": "Subir tensión",
  "assist.rewrite": "Reescribir",
  "assist.ai": "IA",
  "assist.apply": "Aplicar",

  "script.duration": "Duración",
  "script.onTarget": "Dentro del objetivo",
  "script.tooLong": "Va largo: ~{seconds} s",
  "script.tooShort": "Va corto: ~{seconds} s",

  "script.metrics": "Métricas",
  "script.words": "Palabras",
  "script.pace": "Ritmo",
  "script.paceUnit": "{value} pal/s",
  "script.readability": "Legibilidad",
  "script.readability.high": "Alta",
  "script.readability.medium": "Media",
  "script.readability.low": "Baja",

  "script.assistant": "Asistente",
  "script.versions": "Versiones",
  "script.version.now": "v{n} · ahora",
  "script.version.ago": "v{n} · hace {time}",
  "script.version.original": "v1 · original",

  "script.back": "Volver a las ideas",
  "script.confirm": "Confirmar guion →",
  "script.confirmNote": "A partir de aquí se usan créditos"
}
```

---

## 7. Paso 4 — Voz

```json
{
  "voice.title": "Voz",
  "voice.subtitle": "La voz que hablará tu avatar",
  "voice.search": "Buscar voz...",
  "voice.group.mine": "MIS VOCES",
  "voice.group.library": "BIBLIOTECA",
  "voice.badge.cloned": "Clonada",

  "voice.settings": "Ajustes de voz",
  "voice.preset.natural": "Natural",
  "voice.preset.energetic": "Enérgico",
  "voice.preset.narration": "Narración",
  "voice.advanced": "Avanzado",
  "voice.stability": "Estabilidad",
  "voice.similarity": "Similitud",
  "voice.style": "Estilo",
  "voice.speed": "Velocidad",

  "audio.title": "Audio del guion",
  "audio.generate": "Generar audio",
  "audio.regenerate": "Regenerar",
  "audio.regenerateBlock": "Regenerar este bloque",
  "audio.note": "Escucha antes de generar el video. Regenerar un bloque es barato.",
  "audio.generating": "Generando la voz...",
  "audio.blockFailed": "Este bloque no se generó. Vuelve a intentarlo.",

  "voice.noIntegration.title": "Conecta tu cuenta de ElevenLabs",
  "voice.noIntegration.body": "Necesitamos tu cuenta para generar la voz con la calidad original.",
  "voice.noIntegration.cta": "Ir a Integraciones",
  "voice.noCloned.title": "Todavía no tienes voces propias",
  "voice.noCloned.cta": "Clonar mi voz",

  "voice.modeB.notice": "Escucharás la voz en el video final. Tu cuenta de HeyGen no permite previsualizar aquí.",

  "voice.back": "Volver al guion",
  "voice.continue": "Continuar a Avatar →"
}
```

---

## 8. Paso 5 — Avatar y marca

```json
{
  "style.title": "Avatar y marca",
  "style.subtitle": "Cómo se verá tu video",

  "avatar.title": "Avatar",
  "avatar.looks": "Looks",
  "avatar.willSpeakWith": "Hablará con: {voice}",
  "avatar.changeVoice": "Cambiar",
  "avatar.empty.title": "No encontramos avatares",
  "avatar.empty.body": "Crea un avatar en HeyGen y aparecerá aquí.",

  "preview.live": "Vista previa en vivo",

  "brand.title": "Marca",
  "brand.kit": "Kit: {name}",
  "brand.colors": "Colores",
  "brand.color.primary": "Primario",
  "brand.color.secondary": "Secundario",
  "brand.color.accent": "Acento",
  "brand.logo": "Logo",
  "brand.logoPosition": "Posición",
  "brand.subtitles": "Subtítulos",
  "brand.subtitle.karaoke": "Karaoke",
  "brand.subtitle.block": "Bloque",
  "brand.subtitle.pop": "Pop",
  "brand.highlight": "Resalte",
  "brand.font": "Tipografía",

  "assets.title": "Recursos",
  "assets.subtitle": "Sube imágenes o videos. Los colocamos donde mejor encajen.",
  "assets.drop": "Arrastra imágenes o videos",
  "assets.browse": "o busca en tu equipo",
  "assets.suggested": "Sugerido para: {slot} — {time}",
  "assets.unassigned": "Sin asignar",
  "assets.emptySlots": "Escenas sin recurso: {count}",
  "assets.generate": "Generar con IA",
  "assets.generating": "Generando imágenes...",
  "assets.rightsNotice": "Al subir, confirmas que tienes derechos sobre este material.",

  "style.continue": "Continuar a Escenas →"
}
```

---

## 9. Paso 6 — Escenas

```json
{
  "scenes.title": "Revisa tus escenas",
  "scenes.subtitle": "{count} escenas · {duration} · {resolution} · Plantilla {template}",
  "scenes.badge.uploaded": "Subido",
  "scenes.badge.generated": "Generado",
  "scenes.regenerate": "Regenerar esta escena",

  "track.captions": "SUBTÍTULOS",
  "track.motion": "MOTION GRAPHICS",
  "track.assets": "RECURSOS",
  "track.avatar": "AVATAR",
  "track.music": "MÚSICA",
  "track.voice": "VOZ",
  "track.locked": "Para cambiarlo, vuelve al paso 4",
  "timeline.legend": "Cambio visual cada 8 s · La música baja bajo la voz",

  "music.epic": "Épico inspiracional",
  "music.corporate": "Corporate loop",
  "music.techhouse": "Tech house",
  "music.tension": "Épico con tensión",
  "music.mute": "Silenciar música",
  "music.change": "Cambiar música",

  "summary.title": "Resumen",
  "summary.template": "Plantilla",
  "summary.niche": "Nicho",
  "summary.avatar": "Avatar",
  "summary.voice": "Voz",
  "summary.brand": "Marca",
  "summary.music": "Música",
  "summary.format": "Formato",
  "summary.credits": "Créditos estimados",

  "scenes.generate": "Generar video",
  "scenes.generateNote": "Recibirás el MP4 y el proyecto abierto en el editor."
}
```

---

## 10. Generación

```json
{
  "gen.title": "Generando tu video",
  "gen.canClose": "Puedes cerrar esta pestaña. Te avisamos cuando esté listo.",
  "gen.eta": "Tiempo estimado: {time}",

  "gen.step.ingesting": "Analizando tus fuentes",
  "gen.step.ideating": "Buscando ángulos",
  "gen.step.scripting": "Escribiendo el guion",
  "gen.step.voicing": "Generando la voz",
  "gen.step.visualizing": "Generando las imágenes",
  "gen.step.avatar": "Generando el avatar",
  "gen.step.composing": "Componiendo el video",
  "gen.step.done": "Listo",

  "gen.failed.title": "El video no se pudo generar",
  "gen.failed.refunded": "Se te devolvieron {credits} créditos.",
  "gen.failed.retry": "Volver a intentar"
}
```

---

## 11. Video listo

```json
{
  "done.title": "Tu video está listo",
  "done.meta": "{duration} · {resolution} · {size}",
  "done.download": "Descargar MP4",
  "done.openEditor": "Abrir en el editor",
  "done.duplicate": "Duplicar proyecto",
  "done.creditsUsed": "Se usaron {credits} créditos",
  "done.editorNote": "En el editor puedes ajustar el motion graphics, los subtítulos y la música."
}
```

---

## 12. Integraciones

```json
{
  "int.title": "Integraciones",
  "int.subtitle": "Conecta tus cuentas para generar videos.",
  "int.connect": "Conectar",
  "int.verify": "Verificar",
  "int.disconnect": "Desconectar",
  "int.optional": "Opcional",
  "int.verifiedAgo": "Verificado hace {time}",
  "int.whereIsMyKey": "¿Dónde encuentro mi clave?",

  "int.status.active": "Conectado",
  "int.status.unverified": "Sin verificar",
  "int.status.invalid": "Clave inválida",
  "int.status.expired": "Sesión caducada",
  "int.status.notConnected": "Sin conectar",

  "int.elevenlabs.desc": "Genera la voz de tus videos",
  "int.heygen.desc": "Genera el avatar que habla",
  "int.openai.desc": "Genera las imágenes de tus escenas",
  "int.instagram.desc": "Métricas de tus publicaciones",
  "int.apify.desc": "Analiza enlaces de TikTok e Instagram",

  "int.counts.voices": "{count} voces · {cloned} clonadas",
  "int.counts.avatars": "{count} avatares · Avatar III",

  "link.account": "Cuenta",
  "link.withHeygen": "Vinculada con HeyGen",
  "link.yes": "Sí · {count} voces visibles",
  "link.no": "Sin vincular",
  "link.title": "Vincular tu voz con HeyGen",
  "link.step": "Paso {n} de 3",
  "link.body": "Para que tus voces clonadas aparezcan en HeyGen, hay que pegar tu clave allí una sola vez.",
  "link.copyKey": "Copiar mi clave",
  "link.copied": "Copiada",
  "link.openHeygen": "Abrir HeyGen",
  "link.check": "Ya lo hice, comprobar",
  "link.checking": "Comprobando...",
  "link.once": "Esto se hace una vez, no por cada video.",
  "link.success": "Listo. Encontramos {count} voces tuyas en HeyGen.",
  "link.notFound": "No encontramos tus voces clonadas en HeyGen. Revisa que pegaste la clave completa y que la guardaste.",
  "link.notNeeded": "No hace falta: tu cuenta de HeyGen ya acepta el audio que generamos.",

  "int.disconnect.confirm.title": "¿Desconectar {provider}?",
  "int.disconnect.confirm.body": "Los videos que ya generaste no se ven afectados, pero no podrás crear nuevos hasta volver a conectarla.",
  "int.disconnect.confirm.cta": "Sí, desconectar"
}
```

---

## 13. Biblioteca

```json
{
  "lib.title": "Biblioteca",
  "lib.search": "Buscar videos...",
  "lib.filter.all": "Todos",
  "lib.filter.processing": "En proceso",
  "lib.filter.ready": "Listos",
  "lib.filter.failed": "Fallidos",

  "lib.status.processing": "Generando — paso {step} de {total}",
  "lib.status.ready": "Listo",
  "lib.status.failed": "Falló",

  "lib.empty.title": "Todavía no has creado ningún video",
  "lib.empty.body": "Tu primer video toma menos de 8 minutos.",
  "lib.empty.cta": "Crear mi primer video"
}
```

---

## 14. Ajustes

```json
{
  "settings.profile": "Perfil",
  "settings.team": "Equipo",
  "settings.billing": "Facturación",

  "settings.myVoice": "Mi voz",
  "settings.cloneVoice": "Clonar mi voz",
  "settings.cloneConsent": "Confirmo que esta voz es mía o que tengo autorización expresa de su titular para clonarla.",
  "settings.cloneUpload": "Sube 1 a 5 minutos de audio limpio, sin música ni ruido de fondo.",

  "role.owner": "Propietario",
  "role.admin": "Administrador",
  "role.editor": "Editor",
  "role.viewer": "Lector",
  "settings.invite": "Invitar por correo",

  "billing.plan": "Plan actual",
  "billing.credits": "Créditos disponibles",
  "billing.history": "Historial de créditos",
  "billing.buyCredits": "Comprar créditos",
  "billing.invoices": "Facturas",

  "ledger.purchase": "Compra",
  "ledger.hold": "Reserva",
  "ledger.commit": "Consumo",
  "ledger.refund": "Devolución",
  "ledger.grant": "Bonificación"
}
```

---

## 15. Errores

**Regla:** nunca se expone el error del proveedor. Se dice qué pasó y qué puede hacer el usuario.

```json
{
  "err.generic.title": "Algo salió mal",
  "err.generic.body": "Vuelve a intentarlo. Si sigue pasando, escríbenos.",
  "err.retry": "Reintentar",

  "err.elevenlabs.invalid": "Tu clave de ElevenLabs ya no es válida. Vuelve a conectarla.",
  "err.elevenlabs.limit": "Tu cuenta de ElevenLabs alcanzó su límite. Inténtalo en unos minutos.",
  "err.heygen.invalid": "Tu clave de HeyGen ya no es válida. Vuelve a conectarla.",
  "err.heygen.failed": "No pudimos generar el avatar. Revisa tu cuenta de HeyGen.",
  "err.render.failed": "El video no se pudo componer. Ya lo estamos revisando.",
  "err.script.failed": "No pudimos generar las propuestas. Inténtalo de nuevo.",
  "err.source.link": "No pudimos leer ese enlace. Seguimos con el resto.",
  "err.source.file": "No pudimos leer este archivo. Prueba con otro formato.",
  "err.credits.insufficient": "No te alcanzan los créditos para este video. Necesitas {needed} y tienes {available}.",
  "err.timeout": "Esto está tardando más de lo normal. Te avisamos cuando termine.",
  "err.upload.tooLarge": "El archivo pesa demasiado. El máximo es {max}.",
  "err.upload.type": "Ese formato no lo aceptamos. Usa JPG, PNG, MP4 o PDF."
}
```

---

## 16. Estados vacíos

**Regla:** ilustración + una frase que explique qué falta + una acción. Nunca una tabla vacía.

| Pantalla | Título | Cuerpo | Acción |
|---|---|---|---|
| Dashboard | Todavía no vemos tus métricas | Conecta tu Instagram para ver cómo rinde tu contenido. | Conectar Instagram |
| Biblioteca | Todavía no has creado ningún video | Tu primer video toma menos de 8 minutos. | Crear mi primer video |
| Avatares | No encontramos avatares | Crea un avatar en HeyGen y aparecerá aquí. | Ir a HeyGen |
| Mis voces | Todavía no tienes voces propias | Clona tu voz para que tus videos suenen a ti. | Clonar mi voz |
| Brand Kit | Aún no tienes una identidad de marca | Define tus colores y tu logo una vez, y se aplican a todos tus videos. | Crear identidad |
| Plantillas | — | — | *(nunca está vacío: siempre hay 3)* |

---

## 17. Formatos

| Tipo | Formato | Ejemplo |
|---|---|---|
| Miles | Punto | `8.420` · `842.100` |
| Decimal | Coma | `7,3 %` · `2,39 pal/s` |
| Porcentaje | Espacio antes del `%` | `18,4 %` |
| Duración corta | `m:ss` | `0:50` |
| Duración larga | `Xm Ys` | `3 m 12 s` |
| Fecha corta | día + mes abreviado en minúscula | `18 jul` |
| Fecha larga | con año | `21 may 2026` |
| Relativo | "hace X" | `hace 2 h` · `hace 4 min` |
| Tamaño | Coma decimal | `18,4 MB` |
| Delta positivo | `+` y verde | `+18,4 %` |
| Delta negativo | `−` (menos tipográfico) y rojo | `−1,2 %` |
