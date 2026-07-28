"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { updateBlockText } from "../actions";
import { AssistToolbar } from "./assist-toolbar";
import type { Block } from "@/lib/pipeline/schemas";

// Colores de bloque de guion, consistentes en toda la app — docs/05-DESIGN-TOKENS.md
// §2 "Colores de bloque de guion": hook violeta, promesa azul, contenido verde, CTA naranja.
const BLOCK_BORDER_COLOR: Record<string, string> = {
  hook: "border-l-block-hook",
  promise: "border-l-block-promise",
  content: "border-l-block-content",
  cta: "border-l-block-cta",
};

function borderColorFor(blockPath: string): string {
  const kind = blockPath.split(":")[0];
  return BLOCK_BORDER_COLOR[kind] ?? "border-l-white/12";
}

export function ScriptBlockEditor({
  projectId,
  scriptId,
  blockPath,
  label,
  block,
  disabled,
  children,
}: {
  projectId: string;
  scriptId: string;
  blockPath: string;
  label: string;
  block: Block;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const t = useTranslations("script");
  const [spoken, setSpoken] = useState(block.spoken);
  const [isPending, startTransition] = useTransition();

  function handleBlur() {
    if (spoken === block.spoken || disabled) return;
    startTransition(() => {
      updateBlockText(projectId, scriptId, { blockPath, spoken }).catch(() => null);
    });
  }

  const onScreenEntries = Object.entries(block.onScreen).filter(
    ([, value]) => value !== null && value !== undefined && value !== "",
  );

  return (
    <div
      className={`rounded-2xl border-t border-r border-b border-t-white/6 border-r-white/6 border-b-white/6 border-l-2 bg-surface-panel p-4 ${borderColorFor(blockPath)}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-white/68 uppercase">{label}</span>
        {isPending && <span className="text-[11px] text-white/32">{t("saving")}</span>}
      </div>

      <Textarea
        value={spoken}
        onChange={(e) => setSpoken(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        rows={3}
      />

      {onScreenEntries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/44">
          {onScreenEntries.map(([key, value]) => (
            <span key={key}>
              {key}: {String(value)}
            </span>
          ))}
        </div>
      )}

      <AssistToolbar projectId={projectId} scriptId={scriptId} blockPath={blockPath} disabled={disabled} />
      {children}
    </div>
  );
}
