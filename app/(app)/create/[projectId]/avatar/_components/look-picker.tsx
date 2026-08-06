"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon } from "lucide-react";
import { getLooksForAvatar } from "../actions";
import type { AvatarLook } from "@/lib/providers/heygen";

export function LookPicker({
  projectId,
  avatarId,
  selectedLookId,
  disabled,
  onSelect,
}: {
  projectId: string;
  avatarId: string;
  selectedLookId: string | null;
  disabled: boolean;
  onSelect: (lookId: string) => void;
}) {
  const t = useTranslations("avatar");
  const [looks, setLooks] = useState<AvatarLook[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLooks(null);
    setError(null);
    getLooksForAvatar(projectId, avatarId).then((result) => {
      if (cancelled) return;
      if (result.ok) setLooks(result.looks);
      else setError(result.reason);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId, avatarId]);

  if (error) return <p className="text-xs text-danger">{t(`generateErrors.${error}`)}</p>;
  if (!looks) return <p className="text-xs text-white/44">{t("loadingLooks")}</p>;
  if (looks.length === 0) return <p className="text-xs text-white/44">{t("noLooks")}</p>;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {looks.map((look, index) => {
        const selected = look.lookId === selectedLookId;
        // El nombre visible solo existe en el fallback sin miniatura (abajo):
        // con miniatura, la imagen es alt="" (decorativa) y el botón
        // quedaría sin nombre accesible para lectores de pantalla si no se
        // fija acá — mismo criterio que aria-pressed en voice-picker.tsx.
        const accessibleName = look.name ?? t("lookOption", { n: index + 1 });
        return (
          <button
            key={look.lookId}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(look.lookId)}
            aria-pressed={selected}
            aria-label={accessibleName}
            className={`relative aspect-square overflow-hidden rounded-lg border ${
              selected ? "border-[rgba(124,92,255,.7)] shadow-glow-accent" : "border-white/6 hover:border-white/24"
            }`}
          >
            {look.thumbUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- miniatura remota de HeyGen
              <img src={look.thumbUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/[0.06] text-[10px] text-white/44">
                {look.name ?? "—"}
              </div>
            )}
            {selected && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-accent text-white">
                <CheckIcon className="size-2.5" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
