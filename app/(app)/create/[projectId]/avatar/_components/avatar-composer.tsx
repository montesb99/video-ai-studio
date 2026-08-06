"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { generateAvatar } from "../actions";
import { AvatarPicker } from "./avatar-picker";
import { LookPicker } from "./look-picker";
import { RenderProgress } from "./render-progress";
import { AvatarResult } from "./avatar-result";
import type { AvatarOption, RenderJobStatus } from "../data";
import type { RenderFailureCode } from "../../generate-avatar";

export function AvatarComposer({
  projectId,
  avatars,
  initialAvatarId,
  initialLookId,
  activeRenderJob,
  resultVideoUrl,
  lastFailureCode,
  voiceApproved,
}: {
  projectId: string;
  avatars: AvatarOption[];
  initialAvatarId: string | null;
  initialLookId: string | null;
  activeRenderJob: RenderJobStatus;
  resultVideoUrl: string | null;
  lastFailureCode: RenderFailureCode | null;
  voiceApproved: boolean;
}) {
  const t = useTranslations("avatar");
  const router = useRouter();
  const [avatarId, setAvatarId] = useState(initialAvatarId);
  const [lookId, setLookId] = useState(initialLookId);
  const [isGenerating, startGenerating] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (resultVideoUrl) return <AvatarResult videoUrl={resultVideoUrl} />;
  if (activeRenderJob) return <RenderProgress projectId={projectId} renderJobId={activeRenderJob.id} />;

  function handleGenerate() {
    if (!avatarId || !lookId) return;
    setError(null);
    startGenerating(async () => {
      try {
        const result = await generateAvatar(projectId, avatarId, lookId);
        if (result.ok) router.refresh();
        else setError(result.reason);
      } catch {
        setError("generation_failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      {!voiceApproved && <p className="text-sm text-white/44">{t("missingVoiceApproval")}</p>}
      {lastFailureCode && <p className="text-sm text-danger">{t("previousRenderFailed", { reason: t(`generateErrors.${lastFailureCode}`) })}</p>}

      <div>
        <div className="mb-2 text-xs font-medium text-white/68">{t("avatarLabel")}</div>
        <AvatarPicker
          avatars={avatars}
          selectedAvatarId={avatarId}
          disabled={isGenerating}
          onSelect={(id) => {
            setAvatarId(id);
            setLookId(null);
          }}
        />
      </div>

      {avatarId && (
        <div>
          <div className="mb-2 text-xs font-medium text-white/68">{t("lookLabel")}</div>
          <LookPicker projectId={projectId} avatarId={avatarId} selectedLookId={lookId} disabled={isGenerating} onSelect={setLookId} />
        </div>
      )}

      <div className="border-t border-white/6 pt-5">
        <Button
          className="bg-gradient-accent text-white hover:brightness-110"
          disabled={!voiceApproved || !avatarId || !lookId || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? t("starting") : t("generateButton")}
        </Button>
        {error && <p className="mt-2 text-xs text-danger">{t(`generateErrors.${error}`)}</p>}
      </div>
    </div>
  );
}
