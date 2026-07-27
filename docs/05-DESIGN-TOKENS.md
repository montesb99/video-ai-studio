# 05 — Design tokens · Video AI Studio

> La paleta, la tipografía y el espaciado como tokens. Fuente de verdad para el CSS, para Claude Design y para los prompts de imagen.
> Última actualización: 25 jul 2026

---

## 1. Dirección visual

Clonamos la referencia de "AI Studio": near-black con paneles elevados, acento violeta en gradiente, naranja como acento secundario puntual.

**Lo que cambiamos respecto a la referencia:** aquella es una herramienta de *manipulación 3D* — mucho panel, mucho control. La nuestra es de *automatización*. Menos controles visibles, más superficie de preview, y el panel derecho pasa de "propiedades" a **"resumen + acción principal"**.

---

## 2. Color

### Superficies

| Token | Valor | Uso |
|---|---|---|
| `--surface-base` | `#0B0B10` | Fondo de página |
| `--surface-panel` | `#131320` | Paneles y tarjetas |
| `--surface-raised` | `#1A1A2B` | Tarjetas elevadas, filas activas |
| `--surface-overlay` | `#202034` | Menús, tooltips, modales |
| `--surface-input` | `#0F0F1A` | Campos de formulario |

### Bordes

| Token | Valor |
|---|---|
| `--border-subtle` | `rgba(255,255,255,0.06)` |
| `--border-default` | `rgba(255,255,255,0.10)` |
| `--border-strong` | `rgba(255,255,255,0.16)` |

### Texto

| Token | Valor | Uso |
|---|---|---|
| `--text-primary` | `#F4F4F8` | Títulos y cuerpo principal |
| `--text-secondary` | `rgba(244,244,248,0.68)` | Descripciones |
| `--text-muted` | `rgba(244,244,248,0.44)` | Etiquetas, ayudas, metadatos |
| `--text-disabled` | `rgba(244,244,248,0.26)` | Inhabilitado |

### Acentos

| Token | Valor | Uso |
|---|---|---|
| `--accent` | `#7C5CFF` | Acción primaria, selección, foco |
| `--accent-to` | `#B06AF0` | Fin del gradiente |
| `--accent-soft` | `rgba(124,92,255,0.14)` | Fondos de selección |
| `--accent-border` | `rgba(124,92,255,0.45)` | Bordes de elemento activo |
| `--accent-2` | `#FF7A2F` | Secundario **puntual**: CTA de leads, pista de motion graphics |

```css
--gradient-accent: linear-gradient(135deg, #7C5CFF 0%, #B06AF0 100%);
```

> **Regla del naranja:** máximo **un** elemento naranja por pantalla. Es un acento, no un segundo primario. Si compite con el violeta, la jerarquía se rompe.

### Semánticos

| Token | Valor | Uso |
|---|---|---|
| `--success` | `#22C55E` | Conectado, listo |
| `--warning` | `#F59E0B` | Sin conectar, va largo, datos viejos |
| `--danger` | `#EF4444` | Error, clave inválida, eliminar |
| `--info` | `#3B82F6` | Avisos neutros |

Cada uno con su variante `-soft` al 14 % para fondos de aviso.

### Colores de bloque de guion

**Consistentes en toda la app**: editor, timeline, panel de audio, storyboard.

| Bloque | Token | Valor |
|---|---|---|
| Hook | `--block-hook` | `#7C5CFF` violeta |
| Promesa | `--block-promise` | `#3B82F6` azul |
| Contenido | `--block-content` | `#22C55E` verde |
| CTA final | `--block-cta` | `#FF7A2F` naranja |

### Colores de pista del timeline

| Pista | Token | Valor |
|---|---|---|
| Subtítulos | `--track-captions` | `#A78BFA` |
| Motion graphics | `--track-motion` | `#FF7A2F` |
| Recursos | `--track-assets` | `#64748B` |
| Avatar | `--track-avatar` | `#5B3FD6` |
| Música | `--track-music` | `#22C55E` |
| Voz | `--track-voice` | `#94A3B8` |

Avatar y voz llevan además opacidad reducida y un icono de candado: están bloqueadas a propósito.

---

## 3. Tipografía

**Familia:** Inter (o Geist). Sans geométrica, alta legibilidad a tamaños pequeños, buen soporte de tildes y ñ.

```css
--font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

| Token | Tamaño / interlineado | Peso | Uso |
|---|---|---|---|
| `--text-display` | 32 / 38 px | 600 | Título de pantalla grande |
| `--text-h1` | 24 / 30 px | 600 | Título de pantalla |
| `--text-h2` | 20 / 26 px | 600 | Sección |
| `--text-h3` | 16 / 22 px | 600 | Tarjeta |
| `--text-body` | 14 / 21 px | 400 | Cuerpo |
| `--text-body-sm` | 13 / 19 px | 400 | Cuerpo denso |
| `--text-label` | 12 / 16 px | 500 | Etiquetas |
| `--text-micro` | 11 / 14 px | 500 | Metadatos, insignias |
| `--text-overline` | 11 / 14 px | 600, `letter-spacing: 0.06em`, mayúsculas | GANCHO, LA IDEA, MIS VOCES |

**Principio:** la jerarquía se expresa por **peso y opacidad**, no por saltos de tamaño. Entre `--text-body` y `--text-h3` hay 2 px; la diferencia real la marca el peso.

### Español

- Las tildes y la ñ **nunca se omiten**, ni en mayúsculas: `EDUCACIÓN`, no `EDUCACION`.
- Números con formato local: `8.420` (punto de miles), `7,3 %` (coma decimal, espacio antes del %).
- Fechas cortas en minúscula: `18 jul`, `21 may 2026`.
- Duraciones: `0:50`, `3 m 12 s`.

---

## 4. Espaciado

Rejilla de **8 px**. `--space-1` = 4 px solo para ajustes ópticos.

| Token | px |
|---|---|
| `--space-1` | 4 |
| `--space-2` | 8 |
| `--space-3` | 12 |
| `--space-4` | 16 |
| `--space-5` | 24 |
| `--space-6` | 32 |
| `--space-7` | 48 |
| `--space-8` | 64 |

**Reglas:** padding interno de panel `--space-5`; separación entre paneles `--space-5`; entre secciones de una misma columna `--space-6`; entre elementos de una lista `--space-3`.

---

## 5. Radio y elevación

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` | 8 px | Insignias, chips pequeños |
| `--radius-md` | 12 px | Botones, campos, filas |
| `--radius-lg` | 16 px | Paneles y tarjetas |
| `--radius-xl` | 20 px | Modales, composer de chat |
| `--radius-full` | 9999 px | Pills, avatares |

```css
--shadow-sm:    0 1px 2px rgba(0,0,0,0.30);
--shadow-md:    0 4px 12px rgba(0,0,0,0.35);
--shadow-lg:    0 12px 32px rgba(0,0,0,0.45);
--glow-accent:  0 0 0 1px rgba(124,92,255,0.45),
                0 0 24px rgba(124,92,255,0.18);
```

`--glow-accent` es la firma de **elemento seleccionado**: tarjeta de formato, propuesta elegida, voz activa, avatar elegido.

---

## 6. Layout

| Token | Valor |
|---|---|
| `--sidebar-width` | 232 px |
| `--panel-right-width` | 320 px |
| `--panel-right-narrow` | 300 px |
| `--topbar-height` | 64 px |
| `--content-max` | 1440 px |
| `--wizard-max` | 940 px |

### Breakpoints

| Nombre | Ancho |
|---|---|
| `sm` | 640 px |
| `md` | 768 px |
| `lg` | 1024 px |
| `xl` | 1280 px |
| `2xl` | 1536 px |

---

## 7. Movimiento

```css
--duration-fast:   120ms;
--duration-normal: 200ms;
--duration-slow:   320ms;
--ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

| Interacción | Duración | Curva |
|---|---|---|
| Hover, foco | `fast` | `ease-out` |
| Aparición de panel, acordeón | `normal` | `ease-out` |
| Cambio de paso del wizard | `slow` | `ease-in-out` |
| Skeleton | 1400 ms, bucle | lineal |

Todo respeta `prefers-reduced-motion: reduce` → transiciones a 0 ms, sin bucles.

---

## 8. Componentes clave

### Botón primario
Gradiente `--gradient-accent`, texto `#FFFFFF` peso 600, radio `--radius-md`, padding `12px 20px`. Hover: brillo +6 %. Activo: escala 0,98. Inhabilitado: opacidad 0,4 sin gradiente.

### Botón fantasma
Fondo transparente, borde `--border-default`, texto `--text-secondary`. Hover: fondo `rgba(255,255,255,0.04)`.

### Tarjeta seleccionable
Fondo `--surface-panel`, borde `--border-subtle`, radio `--radius-lg`. Seleccionada: borde `--accent-border` + `--glow-accent` + insignia de check en la esquina. No seleccionadas en un grupo con selección: opacidad 0,7.

### Chip / pill
Radio `--radius-full`, padding `6px 12px`, `--text-label`. Activo: fondo `--accent-soft`, borde `--accent-border`, texto `--text-primary`.

### Stepper
6 pasos con líneas conectoras. Completado: círculo relleno `--accent` con check. Actual: círculo con borde `--accent` de 2 px y texto `--text-primary`. Pendiente: borde `--border-default`, texto `--text-muted`. **Solo aparece en las rutas de `/create`.**

### Tarjeta de créditos (sidebar)
Fondo `--surface-raised`, radio `--radius-lg`. Etiqueta "Créditos" en `--text-label`, valor `8.420 / 20.000` en `--text-body` peso 600, barra de 6 px de alto con `--gradient-accent`.

### Indicador de estado
Punto de 8 px + texto. **Nunca solo el punto**: el color no puede ser el único portador de significado.

| Estado | Punto | Texto |
|---|---|---|
| Conectado / Listo | `--success` | "Conectado" |
| Sin conectar / Aviso | `--warning` | "Sin conectar" |
| Error | `--danger` | "Clave inválida" |
| Procesando | `--accent` pulsante | "Generando..." |

---

## 9. Tailwind

```js
// tailwind.config.ts (extracto)
theme: {
  extend: {
    colors: {
      surface: {
        base: '#0B0B10', panel: '#131320',
        raised: '#1A1A2B', overlay: '#202034',
      },
      accent: {
        DEFAULT: '#7C5CFF', to: '#B06AF0',
        soft: 'rgba(124,92,255,0.14)',
        border: 'rgba(124,92,255,0.45)',
      },
      accent2: '#FF7A2F',
      block: {
        hook: '#7C5CFF', promise: '#3B82F6',
        content: '#22C55E', cta: '#FF7A2F',
      },
    },
    borderRadius: { md: '12px', lg: '16px', xl: '20px' },
    boxShadow: {
      glow: '0 0 0 1px rgba(124,92,255,0.45), 0 0 24px rgba(124,92,255,0.18)',
    },
    fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
  },
}
```

---

## 10. Regla de tema

**Oscuro únicamente.** No hay tema claro en F1, y no se construyen tokens "por si acaso".

Razón: el producto es una herramienta de creación de video que se usa junto a material visual. El fondo oscuro no compite con las miniaturas 9:16, los previews ni el storyboard. Añadir tema claro duplicaría el trabajo de diseño de todos los estados sin una demanda que lo justifique.

Si aparece esa demanda, los tokens están en un solo sitio y la migración es mecánica.
