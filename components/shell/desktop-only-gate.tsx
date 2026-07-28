import { getTranslations } from "next-intl/server";

/**
 * El wizard es solo desktop ≥768px (docs/04-UX-FLOWS.md §18) — pura CSS
 * (md:hidden / hidden md:flex en el layout), sin detección de viewport por
 * JS, para no depender de hidratación ni parpadear en la carga inicial.
 */
export async function DesktopOnlyGate() {
  const t = await getTranslations("wizard");
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center md:hidden">
      <div className="text-lg font-semibold">{t("desktopOnly.title")}</div>
      <div className="text-sm text-white/44">{t("desktopOnly.body")}</div>
    </div>
  );
}
