import "server-only";
import { safeFetchUrl } from "./resolve-url";

// Sprint 3 solo soporta fuentes kind='text' y kind='link' (genérico) de
// extremo a extremo. 'social' necesita Apify (BYOK opcional, sin UI de
// conexión todavía) y 'pdf'/'image'/'audio' necesitan subida a Storage +
// análisis multimodal — quedan fuera de este sprint, ver plan Parte B
// "fuera de alcance". El enum source_kind del schema ya los contempla para
// cuando se sumen.

const SOCIAL_HOSTS = ["tiktok.com", "instagram.com", "youtube.com", "youtu.be"];
const MAX_CHARS = 160_000; // ~40k tokens (docs/03-INTEGRATIONS.md, límite de contexto)

export type ExtractResult =
  | { ok: true; extractedText: string; tokensEst: number }
  | { ok: false; errorCode: string };

function isSocialHost(hostname: string): boolean {
  return SOCIAL_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Aproximación estándar (~4 caracteres/token) — solo para decidir si hace falta resumir, no para facturación. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function extractFromLink(rawUrl: string): Promise<ExtractResult> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, errorCode: "invalid_url" };
  }

  if (isSocialHost(parsed.hostname)) {
    return { ok: false, errorCode: "social_requires_apify" };
  }

  const result = await safeFetchUrl(rawUrl);
  if (!result.ok) return { ok: false, errorCode: result.reason };

  if (result.contentType === "application/pdf") {
    return { ok: false, errorCode: "pdf_not_supported_yet" };
  }

  const raw = result.body.toString("utf-8");
  const text = result.contentType === "text/html" ? stripHtml(raw) : raw.trim();
  if (!text) return { ok: false, errorCode: "empty_content" };

  const truncated = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
  return { ok: true, extractedText: truncated, tokensEst: estimateTokens(truncated) };
}

export function extractFromText(text: string): ExtractResult {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, errorCode: "empty_content" };
  const truncated = trimmed.length > MAX_CHARS ? trimmed.slice(0, MAX_CHARS) : trimmed;
  return { ok: true, extractedText: truncated, tokensEst: estimateTokens(truncated) };
}
