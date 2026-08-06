"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { generateVoice, approveVoice } from "../actions";
import { VoicePicker } from "./voice-picker";
import { PresetPicker } from "./preset-picker";
import { VoicePlayer } from "./voice-player";
import type { VoiceOption } from "../data";
import type { StoredVoiceSettings } from "@/lib/pipeline/voice-presets";

export function VozComposer({
  projectId,
  voices,
  initialVoiceId,
  initialSettings,
  audioUrl,
  scenesReady,
  hasConfirmedScript,
}: {
  projectId: string;
  voices: VoiceOption[];
  initialVoiceId: string | null;
  initialSettings: StoredVoiceSettings;
  audioUrl: string | null;
  scenesReady: boolean;
  hasConfirmedScript: boolean;
}) {
  const t = useTranslations("voice");
  const router = useRouter();
  const [voiceId, setVoiceId] = useState(initialVoiceId);
  const [settings, setSettings] = useState(initialSettings);
  const [isGenerating, startGenerating] = useTransition();
  const [isApproving, startApproving] = useTransition();
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  function handleGenerate() {
    if (!voiceId) return;
    setGenerateError(null);
    startGenerating(async () => {
      try {
        const result = await generateVoice(projectId, voiceId, settings);
        if (result.ok) {
          // generateVoice ya revalidó la ruta server-side — router.refresh()
          // vuelve a pedir los Server Components de esta página (incluida la
          // URL firmada nueva del audio) sin recargar la pestaña entera.
          router.refresh();
        } else {
          setGenerateError(result.reason);
        }
      } catch {
        setGenerateError("generation_failed");
      }
    });
  }

  function handleApprove() {
    setApproveError(null);
    startApproving(async () => {
      try {
        const result = await approveVoice(projectId);
        if (result && !result.ok) setApproveError(result.reason);
      } catch (err) {
        unstable_rethrow(err);
        setApproveError("save_failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      {!hasConfirmedScript && <p className="text-sm text-white/44">{t("missingScript")}</p>}

      <div>
        <div className="mb-2 text-xs font-medium text-white/68">{t("voiceLabel")}</div>
        <VoicePicker voices={voices} selectedVoiceId={voiceId} disabled={isGenerating} onSelect={setVoiceId} />
      </div>

      <div>
        <div className="mb-2 text-xs font-medium text-white/68">{t("presetLabel")}</div>
        <PresetPicker settings={settings} disabled={isGenerating} onChange={setSettings} />
      </div>

      <div className="border-t border-white/6 pt-5">
        <Button
          className="bg-gradient-accent text-white hover:brightness-110"
          disabled={!hasConfirmedScript || !voiceId || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? t("generating") : t("generateButton")}
        </Button>
        {!voiceId && hasConfirmedScript && <p className="mt-2 text-xs text-white/44">{t("missingVoice")}</p>}
        {generateError && <p className="mt-2 text-xs text-danger">{t(`generateErrors.${generateError}`)}</p>}
      </div>

      {audioUrl && (
        <>
          <VoicePlayer audioUrl={audioUrl} />
          <div>
            <Button
              className="bg-gradient-accent text-white hover:brightness-110"
              disabled={!scenesReady || isApproving}
              onClick={handleApprove}
            >
              {isApproving ? t("approving") : t("approveButton")}
            </Button>
            {approveError && <p className="mt-2 text-xs text-danger">{t(`approveErrors.${approveError}`)}</p>}
          </div>
        </>
      )}
    </div>
  );
}
