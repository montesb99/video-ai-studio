"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { applyAssist } from "../actions";

const ACTIONS = ["shorten", "direct", "tension", "rewrite"] as const;

export function AssistToolbar({
  projectId,
  scriptId,
  blockPath,
  disabled,
  onApplied,
}: {
  projectId: string;
  scriptId: string;
  blockPath: string;
  disabled?: boolean;
  onApplied?: () => void;
}) {
  const t = useTranslations("script.assist");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle(action: (typeof ACTIONS)[number]) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await applyAssist(projectId, scriptId, { blockPath, action });
        if (!result.ok) {
          setError(result.reason);
        } else {
          onApplied?.();
        }
      } catch {
        setError("generation_failed");
      }
    });
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {ACTIONS.map((action) => (
        <button
          key={action}
          type="button"
          disabled={disabled || isPending}
          onClick={() => handle(action)}
          className="rounded-md border border-white/12 px-2 py-1 text-[11px] text-white/68 hover:bg-white/[0.04] disabled:opacity-40"
        >
          {t(action)}
        </button>
      ))}
      {isPending && <span className="text-[11px] text-white/32">{t("applying")}</span>}
      {error && <span className="text-[11px] text-danger">{t(`errors.${error}`)}</span>}
    </div>
  );
}
