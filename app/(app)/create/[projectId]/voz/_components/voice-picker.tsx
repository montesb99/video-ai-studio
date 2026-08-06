"use client";

import { useTranslations } from "next-intl";
import { CheckIcon, PlayIcon } from "lucide-react";
import type { VoiceOption } from "../data";

export function VoicePicker({
  voices,
  selectedVoiceId,
  disabled,
  onSelect,
}: {
  voices: VoiceOption[];
  selectedVoiceId: string | null;
  disabled: boolean;
  onSelect: (voiceId: string) => void;
}) {
  const t = useTranslations("voice");

  if (voices.length === 0) {
    return <p className="text-sm text-white/44">{t("noVoices")}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {voices.map((voice) => {
        const selected = voice.id === selectedVoiceId;
        return (
          <div
            key={voice.id}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-pressed={selected}
            aria-disabled={disabled}
            onClick={() => {
              if (!disabled) onSelect(voice.id);
            }}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(voice.id);
              }
            }}
            className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 text-left text-sm transition-colors ${
              disabled ? "pointer-events-none opacity-40" : ""
            } ${
              selected
                ? "border-[rgba(124,92,255,.5)] bg-[rgba(124,92,255,.1)] text-foreground shadow-glow-accent"
                : "border-white/6 bg-surface-panel text-white/68 hover:bg-white/[0.02]"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 truncate font-medium">
                {selected && (
                  <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-gradient-accent text-white">
                    <CheckIcon className="size-2.5" />
                  </span>
                )}
                <span className="truncate">{voice.name}</span>
              </div>
              {voice.isCloned && <div className="mt-0.5 text-[11px] text-white/44">{t("cloned")}</div>}
            </div>
            {voice.previewUrl && (
              <button
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  new Audio(voice.previewUrl!).play().catch(() => null);
                }}
                aria-label={t("preview")}
                className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-white/6 text-white/68 hover:bg-white/[0.06]"
              >
                <PlayIcon className="size-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
