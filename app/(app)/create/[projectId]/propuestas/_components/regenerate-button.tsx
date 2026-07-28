"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { regenerateProposals } from "../actions";

export function RegenerateButton({ projectId }: { projectId: string }) {
  const t = useTranslations("proposals");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await regenerateProposals(projectId);
        if (!result.ok) setError(result.reason);
      } catch {
        setError("generation_failed");
      }
    });
  }

  return (
    <div className="text-right">
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleClick}>
        {isPending ? t("regenerating") : t("regenerateButton")}
      </Button>
      {error && <p className="mt-2 text-xs text-danger">{t(`generateErrors.${error}`)}</p>}
    </div>
  );
}
