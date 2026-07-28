"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckIcon } from "lucide-react";
import { setVideoType, type VideoType } from "../actions";

const TYPES: VideoType[] = ["informativo", "reaccion", "desde_enlace"];

export function TypeSelector({ projectId, value }: { projectId: string; value: string }) {
  const t = useTranslations("idea.type");
  const [isPending, startTransition] = useTransition();

  function handleSelect(type: VideoType) {
    startTransition(() => {
      setVideoType(projectId, type).catch(() => null);
    });
  }

  return (
    <div className="mb-6">
      <div className="mb-2 text-xs font-medium text-white/68">{t("label")}</div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TYPES.map((type) => {
          const selected = value === type;
          return (
            <button
              key={type}
              type="button"
              aria-pressed={selected}
              disabled={isPending}
              onClick={() => handleSelect(type)}
              className={`relative rounded-xl border p-3.5 text-left text-sm transition-colors ${
                selected
                  ? "border-[rgba(124,92,255,.5)] bg-[rgba(124,92,255,.1)] text-foreground shadow-glow-accent"
                  : "border-white/6 bg-surface-panel text-white/68 hover:bg-white/[0.02]"
              }`}
            >
              {selected && (
                <span className="absolute top-3 right-3 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-accent text-white">
                  <CheckIcon className="size-2.5" />
                </span>
              )}
              <div className="pr-5 font-medium">{t(`options.${type}.title`)}</div>
              <div className="mt-0.5 pr-5 text-xs text-white/44">{t(`options.${type}.description`)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
