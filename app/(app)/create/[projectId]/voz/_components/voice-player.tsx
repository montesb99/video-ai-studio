"use client";

import { useTranslations } from "next-intl";

export function VoicePlayer({ audioUrl }: { audioUrl: string }) {
  const t = useTranslations("voice");

  return (
    <div className="rounded-xl border border-white/6 bg-surface-panel p-3">
      <div className="mb-2 text-xs font-medium text-white/68">{t("playerLabel")}</div>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- narración generada, sin pista de subtítulos propia todavía */}
      <audio controls src={audioUrl} className="w-full" />
    </div>
  );
}
