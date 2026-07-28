// Sin "server-only" — se comparte entre la Server Action que confirma el
// guion y el contador de duración en vivo del cliente (duration-meter.tsx).

// docs/07-METODOLOGIA-GUION.md §3.3: medido dos veces en el Spike 0, estable
// entre modelos de ElevenLabs (13,2 vs 13,5 car/s, 2% de diferencia). Se usa
// 13,2 como valor conservador — sobra tiempo antes que faltar.
const CHARS_PER_SECOND = 13.2;

/** Siempre sin espacios — contarlos con espacios infló la estimación un ~21% en el Spike 0. */
export function charCountNoSpaces(text: string): number {
  return text.replace(/\s/g, "").length;
}

export function estimateSeconds(text: string): number {
  return Math.round((charCountNoSpaces(text) / CHARS_PER_SECOND) * 10) / 10;
}
