# Spike 0 — Validación de la cadena real

Prueba end-to-end con tus claves: **ElevenLabs → HeyGen (Avatar III) → HyperFrames → MP4**.

---

## Regla de seguridad

**Nunca pegues tus claves en el chat.** Van en `spike/.env`, que este proyecto ignora y que yo no leo. Los scripts las toman del entorno.

Si alguna vez ves una clave en la conversación, rótala.

---

## Preparación (5 minutos)

Requiere **Node 22 o superior**.

```bash
node --version
```

Copia la plantilla y rellena tus claves:

```bash
cp spike/.env.example spike/.env
```

Abre `spike/.env` y pega:

```
HEYGEN_API_KEY=...
ELEVENLABS_API_KEY=...
```

---

## Ejecución

Corre los pasos **en orden**. Cada uno escribe su resultado en `spike/out/` y solo avanza si el anterior fue bien.

### Paso 1 — Auditar tu cuenta de HeyGen

```bash
node spike/01-heygen-audit.mjs
```

Responde las dos preguntas que la documentación **no** puede responder por ti:

- ¿Cuáles de tus looks soportan `avatar_iii`?
- ¿Cuáles admiten fondo transparente (*matting*)?

**Esta es la comprobación que puede cambiar el diseño.** Si ningún look tiene matting, no se puede poner motion graphics detrás del avatar y hay que replantear la capa visual.

### Paso 2 — Listar tus voces de ElevenLabs

```bash
node spike/02-elevenlabs-voices.mjs
```

Te muestra tus voces clonadas con su `voice_id`. Copia el de tu voz profesional al `.env`:

```
ELEVENLABS_VOICE_ID=...
```

### Paso 3 — Generar el audio con tiempos por palabra

```bash
node spike/03-elevenlabs-audio.mjs
```

Sintetiza el guion de prueba de 50 s y guarda:
- `out/voz.mp3` — el audio
- `out/cues.json` — los tiempos de cada palabra

Escúchalo. **Si la voz no te convence aquí, no sigas** — es exactamente lo que dirá el avatar.

### Paso 4 — Generar el avatar con lip-sync

```bash
node spike/04-heygen-video.mjs
```

Sube el audio, llama a `POST /v3/videos` con `avatar_iii` + `output_format: webm`, espera y descarga.

Guarda `out/avatar.webm` y **anota el consumo real de créditos**.

### Paso 5 — Componer con HyperFrames

```bash
node spike/05-report.mjs
```

Genera `out/REPORTE.md` con todo lo aprendido y los siguientes pasos de composición.

---

## Todo de una vez

```bash
node spike/run-all.mjs
```

Para al primer fallo y dice exactamente qué revisar.

---

## Qué buscamos aprender

| Pregunta | Lo responde |
|---|---|
| ¿Mis looks soportan Avatar III? | Paso 1 |
| ¿Mi avatar da fondo transparente? | Paso 1 — **puede cambiar el diseño** |
| ¿La voz clonada suena bien en 50 s? | Paso 3 |
| ¿Los tiempos por palabra sirven para karaoke? | Paso 3 |
| ¿HeyGen acepta mi audio y sincroniza los labios? | Paso 4 |
| ¿Cuántos créditos consume de verdad? | Paso 4 |
