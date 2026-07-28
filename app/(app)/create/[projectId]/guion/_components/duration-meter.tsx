"use client";

import { useTranslations } from "next-intl";

// Formato numérico local (docs/05-DESIGN-TOKENS.md §3): coma decimal, nunca el
// punto que deja toFixed()/toString() en JS.
function formatSeconds(value: number): string {
  return value.toLocaleString("es", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

// docs/04-UX-FLOWS.md §7: "Si se pasa de 50s ±10%, se pone ámbar" — el
// umbral es relativo al objetivo, no un número fijo de segundos.
export function DurationMeter({ seconds, targetSeconds }: { seconds: number; targetSeconds: number }) {
  const t = useTranslations("script");
  const diff = seconds - targetSeconds;
  const withinRange = Math.abs(diff) <= targetSeconds * 0.1;

  if (withinRange) {
    return <div className="text-xs text-white/44">{t("duration", { seconds: formatSeconds(seconds) })}</div>;
  }

  return (
    <div className="text-xs text-warning">
      {t(diff > 0 ? "tooLong" : "tooShort", { seconds: formatSeconds(seconds) })}
    </div>
  );
}
