import "server-only";
import dns from "node:dns";
import { Agent, fetch as undiciFetch } from "undici";
import { isPrivateOrMetadataIp } from "./ip-guard";

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["text/html", "text/plain", "application/pdf"];

export type SafeFetchResult =
  | { ok: true; contentType: string; body: Buffer }
  | {
      ok: false;
      reason:
        | "invalid_url"
        | "blocked_ip"
        | "dns_error"
        | "unsupported_type"
        | "too_large"
        | "timeout"
        | "http_error"
        | "too_many_redirects";
    };

type Validated = { url: URL; pinnedIp: string; family: 4 | 6 };

async function resolveAndValidate(
  rawUrl: string,
): Promise<{ ok: true; value: Validated } | { ok: false; reason: "invalid_url" | "blocked_ip" | "dns_error" }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "invalid_url" };
  }

  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.promises.lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    return { ok: false, reason: "dns_error" };
  }
  if (addresses.length === 0) return { ok: false, reason: "dns_error" };
  // Conservador: si el hostname resuelve a una mezcla de IP pública y
  // privada, se rechaza igual — no solo cuando TODAS son privadas.
  if (addresses.some((a) => isPrivateOrMetadataIp(a.address))) {
    return { ok: false, reason: "blocked_ip" };
  }

  const first = addresses[0];
  return { ok: true, value: { url, pinnedIp: first.address, family: first.family as 4 | 6 } };
}

/**
 * Guard SSRF para enlaces genéricos pegados por el usuario (paso 1, docs/01
 * §8 y docs/03-INTEGRATIONS.md §6). Resuelve DNS antes de conectar, rechaza
 * IPs privadas/loopback/link-local/metadata, y fija la conexión socket a la
 * IP ya validada vía un `lookup` custom en el Agent de undici — así un
 * cambio de respuesta DNS entre el chequeo y el fetch real (DNS-rebinding)
 * no puede colar una IP privada. Enlaces de TikTok/Instagram/YouTube van por
 * Apify cuando está conectado, no por acá.
 */
export async function safeFetchUrl(rawUrl: string): Promise<SafeFetchResult> {
  let currentUrl = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const validated = await resolveAndValidate(currentUrl);
    if (!validated.ok) return validated;
    const { url, pinnedIp, family } = validated.value;

    const agent = new Agent({
      connect: {
        lookup: (_hostname, _options, callback) => {
          callback(null, pinnedIp, family);
        },
      },
    });

    let response;
    try {
      response = await undiciFetch(url.toString(), {
        redirect: "manual",
        dispatcher: agent,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "user-agent": "VideoAIStudioBot/1.0 (+ingesta de fuentes)" },
      });
    } catch {
      return { ok: false, reason: "timeout" };
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return { ok: false, reason: "http_error" };
      // Nunca se sigue una redirección sin re-correr todo el chequeo (DNS +
      // IP guard) sobre el destino — un servidor "seguro" podría redirigir
      // a localhost o a la IP de metadata.
      currentUrl = new URL(location, url).toString();
      continue;
    }

    if (!response.ok) return { ok: false, reason: "http_error" };

    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return { ok: false, reason: "unsupported_type" };
    }

    const reader = response.body?.getReader();
    if (!reader) return { ok: false, reason: "http_error" };

    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        reader.cancel().catch(() => {});
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }

    return { ok: true, contentType, body: Buffer.concat(chunks) };
  }

  return { ok: false, reason: "too_many_redirects" };
}
