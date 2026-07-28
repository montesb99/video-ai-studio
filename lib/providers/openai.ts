import "server-only";
import { fetchWithRetry } from "./http";

// docs/03-INTEGRATIONS.md §5 — GPT Image es BYOK y crítico (paso 5b: frames
// de escena sin recurso subido). No tiene catálogo que sincronizar: se
// genera bajo demanda.

const BASE_URL = "https://api.openai.com/v1";
const VERIFICATION_MODEL = "gpt-image-1";
// gpt-image-1 factura por tier de calidad, no solo por tamaño: 1024x1024 a
// "low" cuesta $0.011/imagen frente a $0.167 en "high" (el valor que toma
// "auto" si se omite el parámetro) — confirmado contra el pricing público de
// OpenAI en jul 2026. Omitir "quality" aquí encarecía cada verificación de
// clave hasta ~15x sin necesidad: solo hace falta confirmar que el permiso
// existe, no la mejor imagen posible.
const VERIFICATION_QUALITY = "low";

export type OpenAiVerifyResult = {
  status: "active" | "invalid" | "unverified";
  missingPermission?: "image_generation";
  amber?: "no_credits" | "rate_limited";
  scopes: { imageGeneration: boolean };
};

/**
 * No hay forma de comprobar el permiso de generación de imágenes sin una
 * llamada real. Verificado contra el pricing público de OpenAI (jul 2026):
 * `1024x1024` es el tamaño cuadrado más barato de `gpt-image-1` y, sobre
 * todo, `quality: "low"` es lo que realmente controla el costo mínimo
 * ($0.011 vs. $0.167 en "high", que es lo que toma "auto" si se omite el
 * parámetro) — de ahí `VERIFICATION_QUALITY`, no solo el tamaño.
 */
export async function verifyKey(apiKey: string): Promise<OpenAiVerifyResult> {
  const response = await fetchWithRetry(
    `${BASE_URL}/images/generations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VERIFICATION_MODEL,
        prompt: "un único píxel gris, imagen mínima de prueba",
        size: "1024x1024",
        quality: VERIFICATION_QUALITY,
        n: 1,
      }),
    },
    { maxAttempts: 2 },
  );

  if (response.status === 401 || response.status === 403) {
    return {
      status: "invalid",
      missingPermission: "image_generation",
      scopes: { imageGeneration: false },
    };
  }
  if (response.status === 402) {
    return { status: "active", amber: "no_credits", scopes: { imageGeneration: true } };
  }
  if (response.status === 429) {
    // OpenAI no reserva 402 para saldo agotado: devuelve 429 tanto para
    // límite de tasa como para cuota consumida, distinguibles solo por
    // `error.code` en el body (docs/03-INTEGRATIONS.md exige diferenciarlos
    // porque piden acciones distintas: "reintenta en unos minutos" vs.
    // "agrega un método de pago"). Sin confirmación en vivo todavía — ver
    // TODO(api-architect) en el reporte del Sprint 2.
    const body = (await response.json().catch(() => null)) as
      | { error?: { code?: string } }
      | null;
    const amber = body?.error?.code === "insufficient_quota" ? "no_credits" : "rate_limited";
    return { status: "active", amber, scopes: { imageGeneration: true } };
  }
  if (!response.ok) {
    return { status: "unverified", scopes: { imageGeneration: false } };
  }
  return { status: "active", scopes: { imageGeneration: true } };
}
