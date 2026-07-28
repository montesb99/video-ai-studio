import "server-only";

export type ContextSource = {
  kind: string; // source_kind: text | link | social | pdf | image | audio
  platform: string | null;
  url: string | null;
  extractedText: string | null;
};

function escapeText(text: string): string {
  // Nunca dejar que el contenido de la fuente cierre <fuente> o </fuentes> a
  // mano — es la defensa contra que una fuente maliciosa "escape" del
  // delimitador e inyecte una fuente falsa con instrucciones (docs/07 §5).
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return value.replace(/"/g, "&quot;");
}

function sourceKindToTipo(kind: string, platform: string | null): string {
  if (kind === "social" && platform) return platform;
  return kind;
}

/**
 * docs/07-METODOLOGIA-GUION.md §5 — formato de inyección de fuentes. Cada
 * fuente queda envuelta en <fuente> y marcada como DATO NO CONFIABLE en el
 * system prompt (composeSystemPrompt añade la regla, no este helper).
 */
export function buildSourceContext(sources: ContextSource[]): string {
  if (sources.length === 0) return "<fuentes></fuentes>";

  const items = sources.map((source, index) => {
    const id = index + 1;
    const tipo = sourceKindToTipo(source.kind, source.platform);
    const attrs = [`id="${id}"`, `tipo="${escapeAttr(tipo)}"`];
    if (source.platform) attrs.push(`plataforma="${escapeAttr(source.platform)}"`);
    if (source.url) attrs.push(`url="${escapeAttr(source.url)}"`);
    const text = escapeText((source.extractedText ?? "").trim());
    return `  <fuente ${attrs.join(" ")}>\n    ${text}\n  </fuente>`;
  });

  return `<fuentes>\n${items.join("\n")}\n</fuentes>`;
}
