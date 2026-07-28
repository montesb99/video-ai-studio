import { getTranslations } from "next-intl/server";

/** Informativo por ahora: muestra el historial de versiones, sin cambiar de versión activa desde acá (Sprint 3 solo trabaja sobre la última). */
export async function VersionList({
  versions,
}: {
  versions: Array<{ id: string; version: number; isConfirmed: boolean }>;
}) {
  const t = await getTranslations("script.versions");
  if (versions.length <= 1) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] text-white/44">
      <span>{t("label")}</span>
      {versions.map((v) => (
        <span
          key={v.id}
          className={`rounded-full border px-2 py-0.5 ${
            v.version === versions[0].version ? "border-[rgba(124,92,255,.5)] text-foreground" : "border-white/12"
          }`}
        >
          v{v.version}
          {v.isConfirmed ? " ✓" : ""}
        </span>
      ))}
    </div>
  );
}
