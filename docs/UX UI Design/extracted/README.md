# Diseño extraído

`../Video AI Studio.html` es un bundle exportado tipo Artifact (~3.4 MB): un `<script type="__bundler/manifest">` con los assets (fuentes, CSS, JS del runtime de preview) y un `<script type="__bundler/template">` con el HTML de las 13 pantallas en un pseudo-formato de plantilla (`sc-if`, `sc-for`, `dc-import`, `{{ variable }}`). No es HTML renderizable directo — solo el "unpacker" bundler lo interpreta en el navegador.

Estos 3 archivos son el contenido ya extraído a texto plano (con un script Node + zlib), para poder leerlo y traducirlo a JSX/Tailwind sin tener que re-descomprimir el bundle cada vez:

- **`all-screens.html`** — las 13 pantallas completas, cada una en un bloque `<!-- ══ N · NOMBRE ══ --><sc-if value="{{ sN }}">...`. Estilos inline pixel-exactos: colores, paddings, radios, tipografía.
- **`sidebar.html`** — el componente de navegación lateral (232px), con su lógica de estado activo en el `<script type="text/x-dc">` al final.
- **`topbar.html`** — el componente de barra superior, incluida la lógica del stepper de 6 pasos (`showStepper: cur > 0` — nunca se muestra si `step` es 0, que es el caso del dashboard).

## Cómo usarlos

Al construir cualquier pantalla, se traduce el fragmento correspondiente de `all-screens.html` (o `sidebar.html`/`topbar.html` para el shell) a componentes de React + Tailwind v4, conservando los valores literales (colores, spacing, tamaños) — no se re-derivan desde `docs/05-DESIGN-TOKENS.md` por separado, porque este archivo ya es más preciso.

Los placeholders `{{ variable }}` marcan datos dinámicos (a reemplazar por props/estado reales); `sc-for` marca listas; `sc-if` marca condicionales de visibilidad.
