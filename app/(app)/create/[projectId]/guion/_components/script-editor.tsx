"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { confirmScript } from "../actions";
import { ScriptBlockEditor } from "./script-block-editor";
import { CtaKeywordPicker } from "./cta-keyword-picker";
import { DurationMeter } from "./duration-meter";
import type { ScriptRow } from "../data";

type ConfirmError = { reason: string; needed?: number; available?: number };

export function ScriptEditor({
  projectId,
  script,
  targetSeconds,
  ctaSuggestions,
}: {
  projectId: string;
  script: ScriptRow;
  targetSeconds: number;
  ctaSuggestions: string[];
}) {
  const t = useTranslations("script");
  const [isConfirming, startConfirming] = useTransition();
  const [confirmError, setConfirmError] = useState<ConfirmError | null>(null);

  function handleConfirm() {
    setConfirmError(null);
    startConfirming(async () => {
      try {
        const result = await confirmScript(projectId, script.id);
        if (result && !result.ok) {
          setConfirmError({
            reason: result.reason,
            needed: "needed" in result ? result.needed : undefined,
            available: "available" in result ? result.available : undefined,
          });
        }
      } catch (err) {
        // confirmScript redirige a /voz en éxito — sin relanzar la señal de
        // navegación de Next, este catch la trataba como un fallo real.
        unstable_rethrow(err);
        setConfirmError({ reason: "save_failed" });
      }
    });
  }

  const disabled = script.isConfirmed;

  return (
    <div className="space-y-3">
      <ScriptBlockEditor
        projectId={projectId}
        scriptId={script.id}
        blockPath="hook"
        label={t("blocks.hook")}
        block={script.blocksJson.hook}
        disabled={disabled}
      />
      <ScriptBlockEditor
        projectId={projectId}
        scriptId={script.id}
        blockPath="promise"
        label={t("blocks.promise")}
        block={script.blocksJson.promise}
        disabled={disabled}
      />
      {script.blocksJson.content.map((block, index) => (
        <ScriptBlockEditor
          key={index}
          projectId={projectId}
          scriptId={script.id}
          blockPath={`content:${index}`}
          label={t("blocks.content", { n: index + 1 })}
          block={block}
          disabled={disabled}
        />
      ))}
      <ScriptBlockEditor
        projectId={projectId}
        scriptId={script.id}
        blockPath="cta"
        label={t("blocks.cta")}
        block={script.blocksJson.cta}
        disabled={disabled}
      >
        <CtaKeywordPicker
          projectId={projectId}
          scriptId={script.id}
          keyword={script.blocksJson.palabraClave}
          suggestions={ctaSuggestions}
          disabled={disabled}
        />
      </ScriptBlockEditor>

      <div className="flex items-center justify-between border-t border-white/6 pt-4">
        <DurationMeter seconds={script.estimatedSeconds ?? 0} targetSeconds={targetSeconds} />
        {disabled ? (
          <span className="text-xs text-success">{t("confirmed")}</span>
        ) : (
          <Button
            className="bg-gradient-accent text-white hover:brightness-110"
            disabled={isConfirming}
            onClick={handleConfirm}
          >
            {isConfirming ? t("confirming") : t("confirmButton")}
          </Button>
        )}
      </div>

      {confirmError && (
        <p className="text-xs text-danger">
          {confirmError.reason === "insufficient_credits"
            ? t("errors.insufficientCredits", { needed: confirmError.needed ?? 0, available: confirmError.available ?? 0 })
            : t(`errors.${confirmError.reason}`)}
        </p>
      )}
    </div>
  );
}
