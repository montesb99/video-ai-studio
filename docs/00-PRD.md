# 00 — PRD · Video AI Studio

> Documento de producto. Qué construimos, para quién, y qué dejamos fuera a propósito.
> Última actualización: 25 jul 2026

---

## 1. Definición

> **Video AI Studio** convierte una idea o un enlace en un video vertical listo para publicar —guion viral, avatar hablando con tu voz clonada, motion graphics, música y branding— sin que el usuario toque un editor.

Salida: **MP4 9:16, 1080×1920, ~50 segundos**, más el proyecto abierto en el editor por si quiere ajustar.

---

## 2. El problema

El creador de contenido corto tiene el cuello de botella en la **producción**, no en las ideas. Grabar, editar, poner subtítulos, buscar música sin copyright y montar motion graphics consume 3–5 horas por video. Eso limita la frecuencia de publicación, y la frecuencia es lo que determina el crecimiento.

Las herramientas actuales resuelven un trozo:

| Herramienta | Resuelve | Deja fuera |
|---|---|---|
| HeyGen | Avatar hablando | Guion, motion graphics, branding, música |
| ElevenLabs | Voz | Todo lo demás |
| CapCut / Premiere | Edición | Exige saber editar y tiempo |
| ChatGPT | Guion | No produce video |

Nadie une la cadena completa. Y quien la une (agencias) cobra $300–800 por video.

---

## 3. Usuarios

| Segmento | Perfil | Dolor principal | Disposición a pagar |
|---|---|---|---|
| **Creador solo** | Nicho de finanzas, IA, salud o mentalidad. Publica 1/semana, quiere 5 | La edición le come el tiempo | $29–49/mes |
| **Agencia pequeña** | 3–15 clientes, mismo formato con distinto branding | Escala lineal en horas-persona | $149–399/mes |
| **Infoproductor / negocio local** | Quiere presencia en video, no quiere salir en cámara | No sabe editar y no va a aprender | $49–99/mes |

### El anti-usuario

**El editor profesional que quiere control frame a frame.** No construimos para él, y esa decisión define lo que dejamos fuera: no hay timeline de edición libre, no hay keyframes manuales, no hay control de curvas de animación. Cada vez que dudemos entre "más control" y "menos pasos", gana **menos pasos**.

---

## 4. Principio rector: 3 clics

```
Clic 1 → ¿Qué tipo de video?   (Informativo · Reacción · Desde un enlace)
Clic 2 → Escribe tu idea       (chat + adjuntar enlace, PDF, texto, imagen)
Clic 3 → Generar ideas
        ↓
   elegir 1 de 3 propuestas → confirmar guion → escuchar la voz
        → avatar y marca precargados → aprobar escenas → MP4
```

**Regla de diseño:** cualquier campo que el sistema pueda adivinar **no se pregunta** — se muestra ya resuelto, con opción de cambiar.

Los únicos dos momentos donde el usuario decide de verdad son **elegir la propuesta** y **confirmar el guion**. Todo lo demás viene precargado del Brand Kit y del "último usado".

---

## 5. Los 6 pasos

| Paso | Nombre | Qué decide el usuario | Cuesta créditos |
|---|---|---|---|
| 1 | **Idea** | Tipo de video, su idea escrita, fuentes adjuntas, nicho | No |
| 2 | **Propuestas** | Cuál de las 3 ideas quiere contar | No |
| 3 | **Guion** | El texto final. Lo edita con ayuda de IA y lo confirma | No |
| 4 | **Voz** | Qué voz clonada usará. Aquí se genera y **se escucha** el audio | Sí (poco) |
| 5 | **Avatar y marca** | Qué avatar y look, con qué branding y recursos | No |
| 6 | **Escenas** | Revisa el storyboard y aprueba. Se renderiza | Sí |

**Por qué la voz va antes que el avatar:** el avatar necesita el audio para existir. HeyGen genera el video haciendo lip-sync sobre ese archivo. Además, escuchar antes de renderizar significa que corregir la voz cuesta segundos en lugar de un video entero.

**Por qué avatar y marca van juntos:** son la misma pregunta —"cómo se ve mi video"— y separarlos añadía un paso sin añadir una decisión.

---

## 6. Módulos

### A. Entrada de la idea (chat multi-fuente)

Campo de chat donde el usuario escribe su idea y adjunta lo que tenga:

| Fuente | Qué se extrae |
|---|---|
| Texto libre | La idea tal cual |
| Enlace de noticia / artículo | Titular, cuerpo, fecha, medio |
| Enlace de TikTok / IG / YouTube | Metadata, métricas, transcripción, **estructura** |
| PDF | Texto por páginas (OCR si es escaneado) |
| Imagen / captura | Texto y contexto visual |
| Nota de voz | Transcripción |

Todo se normaliza a un contexto único. Límite: ~40k tokens; si se excede, se resume por fuente antes de unir.

**Comportamiento:** entrada única. Una pasada, sin repreguntas. Si falta contexto, se asume y se muestra la asunción en las propuestas.

### B. Propuestas de ideas

3 propuestas comparables, con estructura fija:

```json
{
  "gancho": "Título principal, la frase que detiene el scroll",
  "descripcion": "De qué trata la idea",
  "porQueFunciona": "Tensión, contraste, dato inesperado o error común",
  "viralidad": { "puntaje": 87, "razon": "..." },
  "enfoque": "storytelling_informativo | reaccion_informativa | dato_duro",
  "cta": { "objetivo": "leads | seguidores", "texto": "...", "palabraClave": "IA" },
  "duracionEstimada": 50
}
```

Los 3 enfoques cubren **ángulos distintos del mismo material**, no 3 versiones de lo mismo.

#### Motor de CTA

| Objetivo | Mecánica | Ejemplo |
|---|---|---|
| **Leads** | Palabra clave en comentarios | *"Comenta **IA** y te envío el sistema completo"* |
| **Seguidores** | Promesa de continuidad | *"Sígueme, mañana subo la parte 2"* |

**La palabra clave por defecto es `INNOVACION`** — la del creador, consistente en todos los videos. No se inventa una por tema: la constancia es lo que entrena a la audiencia a comentarla. Variantes solo cuando el objetivo lo justifica: `BECA` para un curso, `FINANZAS` para un lead magnet, o el nombre del producto en un anuncio.

**Reglas de la palabra clave:** una sola palabra, **en mayúsculas y sin tildes en pantalla**, fácil de teclear. Cualquier fricción al escribir mata la conversión.

> Ojo: en el texto hablado va **en minúscula y con tilde** (`innovación`), porque el sintetizador lee caracteres. Dos representaciones del mismo CTA, una por medio. Ver [`07-METODOLOGIA-GUION.md`](07-METODOLOGIA-GUION.md) §3-bis.

La biblioteca de CTAs es una **tabla editable**, no código. Añadir patrones no requiere desplegar.

### C. Guion

Estructura fija de 4 bloques para 50 segundos:

| Bloque | Función | Duración objetivo |
|---|---|---|
| **Hook** | Detener el scroll. Primera frase, sin preámbulo | 0–3 s |
| **Promesa justificada** | Qué gana quien se quede, y por qué debe creerte | 3–8 s |
| **Contenido informativo** | 3–4 puntos concretos | 8–43 s |
| **CTA final** | La acción única, con su palabra clave | 43–50 s |

Editor de texto con asistencia: bloques editables, contador de duración en vivo, y acciones sobre la selección — *acortar, más directo, subir tensión, reescribir*.

**Estilo:** ver [`07-METODOLOGIA-GUION.md`](07-METODOLOGIA-GUION.md).

**Salida:** texto plano segmentado en los 4 bloques. Es la única entrada que necesita el paso 4.

### D. Voz

1. **Elegir la voz** — dos grupos: **Mis voces** (clonadas, primero y destacadas) y **Biblioteca**. Preview de 3s en línea.
2. **Ajustar** — presets `Natural` / `Enérgico` / `Narración`, con modo avanzado plegado.
3. **Generar y escuchar** — el guion se sintetiza por bloques. Se puede regenerar un solo bloque.

**Salida:** archivo de audio **+ tiempos de cada palabra** (ElevenLabs los devuelve en la misma respuesta). Esos tiempos alimentan los subtítulos karaoke sin ningún paso extra.

Extras: clonar voz nueva desde Ajustes (con **consentimiento obligatorio**: solo voz propia o autorizada) y diccionario de pronunciación por workspace (que "IA" se lea *i-a*, no *ía*).

### E. Avatar y marca

Una sola pantalla, preview vertical al centro.

- **Avatar** (izquierda): lista sincronizada de HeyGen + looks. Debajo, recordatorio fijo: *"Hablará con: Voz Profesional — Diego"*. **Modelo fijo: Avatar III**, sin selector — consumo aceptable, coste predecible y una decisión menos para el usuario.
- **Marca** (derecha): Brand Kit reutilizable — colores, logo, posición de marca de agua, tipografía, estilo de subtítulo, color de resalte. Selector de kit arriba (una agencia cambia de cliente en un clic).
- **Recursos** (abajo, ancho completo): subir imágenes y videos.

#### Asignación automática de recursos

1. **Se analiza el archivo** — Claude multimodal: qué muestra, si tiene texto, aspecto, dominancia de color.
2. **Se compara con los slots de la plantilla** — cada plantilla declara sus huecos (`fondo del hook`, `gráfico del dato`, `B-roll de transición`) con aspecto y tipo esperados.
3. **Se propone la asignación** — el recurso aparece colocado con su explicación: *"Sugerido para: Dato — 00:15"*. **La IA propone, el usuario manda.**
4. **Se normaliza** — recorte al aspecto del slot, ajuste de resolución, recorte del tramo útil en video.

### F. Motor de imágenes de escena

Los slots sin recurso subido se generan con GPT Image:

```
bloque del guion + slot de la plantilla + brand kit → prompt → imagen
```

**Reglas:**
- **El prompt lo arma la plataforma**, no el usuario. Este solo ve el resultado y un botón de regenerar.
- **Sin texto dentro de la imagen.** Los modelos rompen las tildes y el español sale mal. Todo el texto lo pone HyperFrames encima como tipografía real.
- **Aspecto correcto de origen**, no recortado después.
- **Coherencia entre escenas**: un descriptor de estilo compartido en las N imágenes del video.
- **Caché por prompt**: mismo bloque + mismo kit = misma imagen, sin volver a cobrar.

### G. Motion graphics, música y render

Ver [`08-ESTRUCTURA-MOTION.md`](08-ESTRUCTURA-MOTION.md) para la estructura escena por escena.

**Capas superpuestas** (no se "mezclan", se apilan):

```
  SUBTÍTULOS       karaoke palabra a palabra, siempre encima
  MOTION GRAPHICS  superpuesto: tipografía cinética, formas, tarjetas, logo
  RECURSOS         imágenes subidas o generadas, B-roll
  AVATAR           video de HeyGen con fondo transparente (alpha)
  FONDO            gradiente o color de marca
  ───────────────────────────────────────────────────────
  MÚSICA           bed sin copyright, con ducking bajo la voz
  VOZ              audio de ElevenLabs
```

**Ritmo:** ningún plano dura más de **8 segundos** sin un cambio visual. En 50s son 6–7 beats. Los beats se alinean con los tiempos por palabra, de forma que las transiciones caigan **entre frases y nunca a mitad de una palabra**.

**Música libre de derechos**, por bloque:

| Bloque | Intención | Estilo |
|---|---|---|
| Hook + Promesa | Levantar, generar expectativa | Inspiracional épico |
| Contenido + CTA | Sostener sin distraer | Corporate loop o tech house |

Por tipo de video:

| Tipo | Hook + Promesa | Contenido + CTA |
|---|---|---|
| Informativo | Inspiracional épico | Corporate loop |
| Reacción | Épico con tensión | Tech house |
| Desde un enlace | Heredado del análisis | Heredado |

**Reglas de audio:** ducking a −18 dB bajo la voz; crossfade alineado al beat en el cambio Promesa → Contenido, nunca corte seco; el usuario puede cambiar el tema o silenciar desde el editor.

### H. Analítica de publicaciones

El panel principal **no es de creación**, es de rendimiento.

- Cuentas conectadas: Instagram vía Meta Graph API (OAuth). TikTok en F2.
- Métricas por publicación: reproducciones, me gusta, comentarios, guardados, compartidos, alcance, tasa de interacción.
- Métricas agregadas: evolución 7/30/90 días vs. periodo anterior.
- **Cada publicación se enlaza con el proyecto que la generó.** Eso responde la única pregunta que le importa al creador: *¿qué nicho, qué gancho y qué plantilla rinden mejor?* — y realimenta el generador de guiones.

> El progreso de los videos en generación **no vive en el dashboard**: vive en Biblioteca con filtro "En proceso", más una notificación al terminar.

---

## 7. La entrega

Dos cosas, no una:

- **MP4 9:16** listo para publicar, descargable.
- **Proyecto abierto en el editor de HyperFrames**, con el timeline por pistas.

| Pista | ¿Editable en F1? |
|---|---|
| Subtítulos | Texto y estilo |
| Motion graphics | Tiempos y qué elemento entra |
| Recursos | Reemplazar el recurso |
| Avatar | **No** — se regenera desde el paso 4 |
| Música | **Sí**: cambiar tema, mover el corte, silenciar |
| Voz | **No** — se regenera desde el paso 4 |

Avatar y voz se muestran **bloqueados a propósito**: tocarlos no tendría efecto sin rehacer la generación, y dejar controles que no hacen nada es peor que no tenerlos.

---

## 8. Fases

| Fase | Alcance | Criterio de salida |
|---|---|---|
| **F1 — MVP** | Flujo de 6 pasos → MP4 + proyecto en el editor. 3 plantillas. BYOK. Créditos | Un usuario no técnico genera un video publicable en **< 8 min sin ayuda** |
| **F2 — Editor integrado** | Studio embebido, re-render en un clic, historial de versiones. Voces por descripción. TikTok | El usuario ajusta y re-renderiza sin salir de la plataforma |
| **F3 — Escala** | Lotes, calendario de publicación, multi-idioma, API pública, workspaces de agencia | 10 videos generados en un solo lote |

---

## 9. Métricas de éxito

| Métrica | Objetivo F1 | Por qué esta |
|---|---|---|
| **Tiempo al primer video** | < 8 min | Es la promesa entera del producto |
| **Tasa de finalización del wizard** | > 60 % | Mide si los 6 pasos son realmente pocos |
| **Videos por usuario activo / semana** | > 3 | Mide si resolvimos el cuello de botella |
| **Tasa de re-generación de guion** | < 30 % | Si es alta, el motor de guiones no da la talla |
| **Videos publicados / videos generados** | > 50 % | Mide calidad real, no uso |
| Retención a 30 días | > 40 % | — |

---

## 10. Modelo de negocio

**BYOK en F1.** El usuario conecta sus propias claves de HeyGen, ElevenLabs y OpenAI, y paga sus propios créditos de esos proveedores. Nosotros cobramos por la orquestación.

Razón: elimina el riesgo de margen negativo desde el día 1 y permite lanzar sin datos de consumo. En F2, cuando existan esos datos, se ofrece un plan "todo incluido" con markup.

### Costos por video de 50 s (a validar con precios reales)

| Concepto | Estimación |
|---|---|
| Claude (propuestas + guion + análisis) | ~$0,04 |
| GPT Image (3–4 frames) | ~$0,15 |
| ElevenLabs (~119 palabras) | ~$0,05 |
| HeyGen avatar 50 s — **Avatar III** | 1–2 créditos HeyGen (se mide en el Sprint 0) |
| Render HyperFrames 1080p | créditos HeyGen |
| Música (catálogo propio libre) | $0 |
| Storage + egress | ~$0,01 |

### Ledger de créditos

Patrón **hold → commit | refund**, append-only. Nunca un `UPDATE` sobre un saldo. El `hold` se hace al confirmar el guion (paso 3→4), que es donde empieza el gasto real. Si el pipeline falla, se devuelve automáticamente.

---

## 11. Fuera de alcance (explícito)

- Edición frame a frame o keyframes manuales
- Grabación desde la plataforma
- Publicación automática a redes (F3)
- Videos horizontales o de más de 90 s
- Idiomas distintos del español (F3)
- Avatares propios entrenados por nosotros — eso es HeyGen
- Música con licencia comercial de pago

---

## 12. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| HeyGen no acepta audio externo | **Bajo** — hay salida diseñada | El Modo B (clave de ElevenLabs vinculada a HeyGen desde nuestra app) cubre el caso sin rediseñar. Se pierde el preview del paso 4 y los tiempos gratis, nada más. Se valida en el **Sprint 0** |
| **App Review de Meta se atrasa** | **Medio — el único riesgo de calendario real.** Solo afecta al panel de métricas (Sprint 7), no a generar videos | Enviar a revisión **en paralelo** al sprint 7, no al final. Plan B: Windsor.ai. **Nada de esto bloquea el producto principal** |
| Prompt injection desde PDFs/enlaces | Alto — es el riesgo principal del producto | Contenido extraído como dato delimitado no confiable; salida forzada a JSON con esquema |
| El output suena genérico | Alto — mata la retención | La metodología propia como capa de prompt, no un prompt genérico |
| Costos de proveedor suben | Medio | BYOK en F1 traslada el riesgo hasta tener datos |

---

## 13. Documentos relacionados

| Doc | Contenido |
|---|---|
| [01-ARCHITECTURE](01-ARCHITECTURE.md) | Sistema, pipeline, decisiones técnicas |
| [02-DATA-MODEL](02-DATA-MODEL.md) | Esquema SQL y políticas RLS |
| [03-INTEGRATIONS](03-INTEGRATIONS.md) | Contrato por proveedor |
| [04-UX-FLOWS](04-UX-FLOWS.md) | Las 13 pantallas y su navegación |
| [05-DESIGN-TOKENS](05-DESIGN-TOKENS.md) | Paleta, tipografía, espaciado |
| [06-COPY-ES](06-COPY-ES.md) | Copy deck en español |
| [07-METODOLOGIA-GUION](07-METODOLOGIA-GUION.md) | La capa de prompts del motor de guiones |
| [08-ESTRUCTURA-MOTION](08-ESTRUCTURA-MOTION.md) | **Pendiente**: estructura escena por escena |
