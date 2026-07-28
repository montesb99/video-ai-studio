// Fórmula provisional — se recalibra en el Sprint 6 con el modelo de
// precios/Stripe real. El pipeline necesita *un* número para hacer el hold
// de créditos al confirmar el guion, no el número final de negocio.
const BASE_CREDITS = 14;
const BASE_SECONDS = 50;

export function estimateProjectCredits(targetSeconds: number): number {
  return Math.max(1, Math.round((targetSeconds / BASE_SECONDS) * BASE_CREDITS));
}
