"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { checkRenderStatus } from "../actions";

const POLL_INTERVAL_MS = 5000;

// docs/04-UX-FLOWS.md §11 y prompts/CLAUDE-DESIGN-MASTER.md §8 ("Qué NO
// hacer"): "un spinner sin número" está prohibido para esperas de minutos —
// el render de HeyGen mide 60-209s reales (ver avatar/page.tsx). El spinner
// se mantiene como refuerzo visual, pero el número transcurrido es el dato
// que realmente comunica progreso.
//
// Formato "Xm Ys" (docs/05-DESIGN-TOKENS.md §3 y docs/06-COPY-ES.md §17,
// "Duración larga"), no "mm:ss" ("Duración corta", reservado para la
// duración total de un video como "0:50") — esta espera mide minutos, no
// segundos, y el propio ejemplo de docs/04-UX-FLOWS.md §11 para este mismo
// paso ("Generando el avatar 3 m 29 s") usa ese formato.
function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes} m ${seconds} s` : `${seconds} s`;
}

export function RenderProgress({ projectId, renderJobId }: { projectId: string; renderJobId: string }) {
  const t = useTranslations("avatar");
  const router = useRouter();
  const pollingRef = useRef(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (pollingRef.current) return; // no solapar sondeos si uno tarda más de 5s
      pollingRef.current = true;
      try {
        const result = await checkRenderStatus(projectId, renderJobId);
        if (result.status !== "processing") {
          // Terminal (completed o failed): el servidor ya revalidó la ruta
          // dentro de checkRenderStatus — router.refresh() trae el resultado
          // final (video listo, o el mensaje de error) sin recargar la pestaña.
          router.refresh();
        }
      } finally {
        pollingRef.current = false;
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [projectId, renderJobId, router]);

  useEffect(() => {
    const tick = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div
      className="flex flex-col items-center gap-3 rounded-xl border border-white/6 bg-surface-panel p-8 text-center"
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/12 border-t-brand-accent" />
      <div className="text-sm font-medium">{t("rendering")}</div>
      <div className="text-xs text-white/44">{t("renderingElapsed", { time: formatElapsed(elapsedSeconds) })}</div>
      <div className="max-w-xs text-xs text-white/44">{t("renderingEta")}</div>
    </div>
  );
}
