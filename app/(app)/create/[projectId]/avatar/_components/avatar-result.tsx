"use client";

import { useTranslations } from "next-intl";

export function AvatarResult({ videoUrl }: { videoUrl: string }) {
  const t = useTranslations("avatar");

  return (
    <div>
      <div className="mx-auto aspect-9/16 max-w-xs overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- video mudo con voz ya incluida en la pista de audio */}
        <video controls src={videoUrl} className="h-full w-full object-contain" />
      </div>
      <p className="mt-3 text-center text-xs text-white/44">{t("resultNote")}</p>
    </div>
  );
}
