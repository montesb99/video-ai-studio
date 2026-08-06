"use client";

import { useTranslations } from "next-intl";
import { CheckIcon, UserIcon } from "lucide-react";
import type { AvatarOption } from "../data";

export function AvatarPicker({
  avatars,
  selectedAvatarId,
  disabled,
  onSelect,
}: {
  avatars: AvatarOption[];
  selectedAvatarId: string | null;
  disabled: boolean;
  onSelect: (avatarId: string) => void;
}) {
  const t = useTranslations("avatar");

  if (avatars.length === 0) {
    return <p className="text-sm text-white/44">{t("noAvatars")}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {avatars.map((avatar) => {
        const selected = avatar.id === selectedAvatarId;
        return (
          <button
            key={avatar.id}
            type="button"
            disabled={disabled}
            aria-pressed={selected}
            onClick={() => onSelect(avatar.id)}
            className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center ${
              selected
                ? "border-[rgba(124,92,255,.5)] bg-[rgba(124,92,255,.1)] shadow-glow-accent"
                : "border-white/6 bg-surface-panel hover:bg-white/[0.02]"
            }`}
          >
            {selected && (
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-accent text-white">
                <CheckIcon className="size-2.5" />
              </span>
            )}
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white/[0.06]">
              {avatar.thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- miniatura remota de HeyGen, fuera de dominios configurados en next/image
                <img src={avatar.thumbUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="size-6 text-white/44" />
              )}
            </div>
            <span className="truncate text-xs text-white/68">{avatar.name}</span>
          </button>
        );
      })}
    </div>
  );
}
