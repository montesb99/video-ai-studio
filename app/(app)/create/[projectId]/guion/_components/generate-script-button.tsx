"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { generateScript } from "../actions";

export function GenerateScriptButton({ projectId, disabled }: { projectId: string; disabled?: boolean }) {
  const t = useTranslations("script");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateScript(projectId);
        if (!result.ok) setError(result.reason);
      } catch {
        setError("generation_failed");
      }
    });
  }

  return (
    <div>
      <Button
        className="bg-gradient-accent text-white hover:brightness-110"
        disabled={disabled || isPending}
        onClick={handleClick}
      >
        {isPending ? t("generating") : t("generateButton")}
      </Button>
      {disabled && <p className="mt-2 text-xs text-white/44">{t("missingProposal")}</p>}
      {error && <p className="mt-2 text-xs text-danger">{t(`generateErrors.${error}`)}</p>}
    </div>
  );
}
