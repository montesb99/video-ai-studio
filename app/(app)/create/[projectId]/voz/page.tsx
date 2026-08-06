import { getTranslations } from "next-intl/server";
import { getVoiceScreenData } from "./data";
import { VozComposer } from "./_components/voz-composer";

// Núcleo síntetiza cada bloque del guion por separado contra ElevenLabs
// (varios round-trips secuenciales: hook + promise + hasta 5 bloques de
// content, ver content.max(5) en lib/pipeline/schemas.ts, + cta = hasta 8
// llamadas, no 6). 90s quedaba justo: con una sola llamada retryable
// (fetchWithRetry hace un segundo intento tras 1s de backoff en 408/429/5xx,
// ver lib/providers/http.ts) por cada uno de los 8 bloques posibles, el
// tiempo ya puede acercarse a ese techo sin margen para la descarga/subida
// del WAV final. 150s dobla el margen sin costo real (el máximo de la
// plataforma ya se usa en otras páginas de este mismo pipeline, ver
// idea/page.tsx).
export const maxDuration = 150;

export default async function VoicePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const t = await getTranslations("voice");
  const data = await getVoiceScreenData(projectId);

  return (
    <div className="mx-auto max-w-2xl p-7 pb-16">
      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight">{t("title")}</div>
        <div className="mt-1 text-sm text-white/68">{t("subtitle")}</div>
      </div>

      <VozComposer
        projectId={projectId}
        voices={data.voices}
        initialVoiceId={data.selectedVoiceId}
        initialSettings={data.voiceSettings}
        audioUrl={data.generatedAudioUrl}
        scenesReady={data.scenesReady}
        hasConfirmedScript={data.hasConfirmedScript}
      />
    </div>
  );
}
