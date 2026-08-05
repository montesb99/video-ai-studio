"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { attachTextSource, attachLinkSource } from "../actions";
import { SourceChip } from "./source-chip";
import type { SourceRow } from "../data";

type Mode = "text" | "link";

// docs/03-INTEGRATIONS.md: límite de contexto ~40k tokens (lib/ingest/extract.ts
// trunca ahí). Se avisa antes de llegar al tope duro, no después.
const TOO_MUCH_CONTEXT_TOKENS = 35_000;

/**
 * Panel de fuentes ADJUNTAS — opcional (salvo "Desde un enlace", donde
 * IdeaComposer exige un enlace listo antes de habilitar Generar). La idea
 * obligatoria vive en IdeaComposer, guardada en projects.idea_prompt, no acá:
 * este componente solo agrega contexto complementario a input_sources.
 */
export function SourceComposer({
  projectId,
  sources,
  defaultMode,
}: {
  projectId: string;
  sources: SourceRow[];
  defaultMode: Mode;
}) {
  const t = useTranslations("idea.source");
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [value, setValue] = useState("");
  const [isAdding, startAdding] = useTransition();

  const readySources = sources.filter((s) => s.status === "ready");
  const totalTokens = readySources.reduce((sum, s) => sum + (s.tokensEst ?? 0), 0);
  const tooMuchContext = totalTokens > TOO_MUCH_CONTEXT_TOKENS;

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    startAdding(async () => {
      try {
        const result = mode === "text" ? await attachTextSource(projectId, trimmed) : await attachLinkSource(projectId, trimmed);
        if (result.ok) setValue("");
      } catch {
        // el chip de error queda del lado del servidor si llegó a crearse la fila; si no, el usuario reintenta
      }
    });
  }

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-white/68">{t("label")}</div>
          <div className="text-[11px] text-white/44">{t("hint")}</div>
        </div>
        <div className="flex gap-1 rounded-lg border border-white/6 p-0.5 text-xs">
          <button
            type="button"
            aria-pressed={mode === "text"}
            onClick={() => setMode("text")}
            className={`rounded-md px-2 py-1 ${mode === "text" ? "bg-white/[0.06] text-foreground" : "text-white/44"}`}
          >
            {t("modeText")}
          </button>
          <button
            type="button"
            aria-pressed={mode === "link"}
            onClick={() => setMode("link")}
            className={`rounded-md px-2 py-1 ${mode === "link" ? "bg-white/[0.06] text-foreground" : "text-white/44"}`}
          >
            {t("modeLink")}
          </button>
        </div>
      </div>

      {mode === "text" ? (
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("textPlaceholder")}
          aria-label={t("label")}
          disabled={isAdding}
          rows={3}
          className="mb-2"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("linkPlaceholder")}
          aria-label={t("label")}
          disabled={isAdding}
          className="mb-2"
        />
      )}

      <Button size="sm" variant="outline" disabled={isAdding || !value.trim()} onClick={handleAdd}>
        {isAdding ? t("adding") : t("addButton")}
      </Button>

      {sources.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {sources.map((source) => (
            <SourceChip key={source.id} projectId={projectId} source={source} />
          ))}
        </div>
      )}

      {tooMuchContext && <p className="mt-3 text-xs text-warning">{t("tooMuch")}</p>}
    </div>
  );
}
