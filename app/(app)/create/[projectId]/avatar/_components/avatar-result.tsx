"use client";

import { useTranslations } from "next-intl";

// Tablero de ajedrez detrás del video: si el webm no trae canal alpha real
// (avatar sin matting en la cuenta de HeyGen del usuario — docs/03-INTEGRATIONS.md
// líneas 266-267), un fondo negro sólido lo hace obvio a simple vista sin
// necesitar detectarlo por código.
const CHECKERBOARD_STYLE = {
  backgroundImage:
    "linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)",
  backgroundSize: "20px 20px",
  backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
  backgroundColor: "#1a1a1a",
};

export function AvatarResult({ videoUrl }: { videoUrl: string }) {
  const t = useTranslations("avatar");

  return (
    <div>
      <div className="mx-auto aspect-9/16 max-w-xs overflow-hidden rounded-2xl" style={CHECKERBOARD_STYLE}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- video mudo con voz ya incluida en la pista de audio */}
        <video controls src={videoUrl} className="h-full w-full object-contain" />
      </div>
      <p className="mt-3 text-center text-xs text-white/44">{t("resultNote")}</p>
    </div>
  );
}
