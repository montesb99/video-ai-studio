import "server-only";

// Política de reintentos común a todos los proveedores — docs/03-INTEGRATIONS.md
// "Reintentos": 408/429/500/502/503/504 con backoff; 400/401/402/403/404/409/422
// nunca se reintentan (402 y 409 explícitamente, por regla dura del proyecto).

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const BACKOFF_MS = [1000, 4000, 15000, 60000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch con reintento automático solo en códigos transitorios.
 *
 * `maxAttempts` por defecto agota los 4 backoffs (~80s en el peor caso) — el
 * valor correcto para llamadas de pipeline en segundo plano (Sprint 5+). Las
 * llamadas de este sprint son todas interactivas (un usuario esperando en la
 * UI a que "Guardar"/"Comprobar" termine), así que cada call site pasa
 * `{ maxAttempts: 2 }` explícitamente para no convertir un 429 en un cuelgue
 * de ~80s indistinguible de que la app se congeló.
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options?: { maxAttempts?: number },
): Promise<Response> {
  const maxAttempts = options?.maxAttempts ?? BACKOFF_MS.length + 1;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, init);
      const isLastAttempt = attempt === maxAttempts - 1;
      if (!RETRYABLE_STATUS.has(response.status) || isLastAttempt) {
        return response;
      }
      await sleep(BACKOFF_MS[attempt]);
    } catch (err) {
      lastError = err;
      if (attempt === maxAttempts - 1) throw err;
      await sleep(BACKOFF_MS[attempt]);
    }
  }

  throw lastError ?? new Error("fetchWithRetry: agotados los reintentos.");
}
