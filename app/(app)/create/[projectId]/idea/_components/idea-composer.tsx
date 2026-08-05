"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateProposals, setIdeaPrompt } from "../actions";
import { SourceComposer } from "./source-composer";
import type { SourceRow } from "../data";

/**
 * Orquesta el paso 1: la casilla de idea (obligatoria, projects.idea_prompt)
 * arriba, las fuentes adjuntas (opcionales, SourceComposer) abajo, y el
 * botón Generar que combina ambas condiciones. Antes, "Fuentes" hacía las
 * dos cosas a la vez (la idea se guardaba como una fuente de texto más) —
 * separado a pedido explícito: la idea es siempre obligatoria y va aparte,
 * las fuentes son material adicional que puede no existir.
 */
export function IdeaComposer({
  projectId,
  sources,
  videoType,
  initialIdeaPrompt,
}: {
  projectId: string;
  sources: SourceRow[];
  videoType: string;
  initialIdeaPrompt: string | null;
}) {
  const t = useTranslations("idea");
  const [ideaPrompt, setIdeaPromptValue] = useState(initialIdeaPrompt ?? "");
  const [isGenerating, startGenerating] = useTransition();
  const [generateError, setGenerateError] = useState<string | null>(null);

  const readySources = sources.filter((s) => s.status === "ready");
  const hasReadyLink = readySources.some((s) => s.kind === "link");
  const hasPendingSource = sources.some((s) => s.status === "pending");
  // docs/04-UX-FLOWS.md §5: con "Desde un enlace" el enlace es obligatorio,
  // además de la idea — no alcanza con haber escrito solo la idea.
  const meetsLinkRequirement = videoType === "desde_enlace" ? hasReadyLink : true;
  const hasIdea = ideaPrompt.trim().length > 0;
  const canGenerate = hasIdea && meetsLinkRequirement && !hasPendingSource;

  // Referencia (no estado) al autoguardado en curso: handleGenerate lo
  // espera antes de escribir su propio valor, para que un blur viejo en
  // vuelo no pueda resolver DESPUÉS y pisar el valor recién confirmado en
  // projects.idea_prompt — sin esto, regenerateProposals y el paso de guion
  // podían terminar leyendo un idea_prompt más viejo que el que realmente
  // generó las propuestas.
  const pendingSaveRef = useRef<Promise<unknown> | null>(null);

  function handleIdeaBlur() {
    pendingSaveRef.current = setIdeaPrompt(projectId, ideaPrompt).catch(() => null);
  }

  function handleGenerate() {
    setGenerateError(null);
    startGenerating(async () => {
      try {
        if (pendingSaveRef.current) await pendingSaveRef.current;
        const result = await generateProposals(projectId, ideaPrompt);
        if (result && !result.ok) setGenerateError(result.reason);
      } catch (err) {
        // redirect() en generateProposals lanza una señal de navegación
        // interna de Next (digest NEXT_REDIRECT) que este catch atraparía
        // por error si no se relanza acá — sin esto, el usuario veía un
        // mensaje rojo de "no pudimos generar" por un instante aunque la
        // generación hubiera sido exitosa y la navegación a /propuestas
        // ya estuviera en curso.
        unstable_rethrow(err);
        setGenerateError("generation_failed");
      }
    });
  }

  return (
    <div>
      <div className="mb-6">
        <label htmlFor="idea-prompt" className="mb-2 block text-xs font-medium text-white/68">
          {t("ideaBox.label")}
        </label>
        <Textarea
          id="idea-prompt"
          value={ideaPrompt}
          onChange={(e) => setIdeaPromptValue(e.target.value)}
          onBlur={handleIdeaBlur}
          placeholder={t("ideaBox.placeholder")}
          aria-required="true"
          disabled={isGenerating}
          rows={4}
        />
      </div>

      <SourceComposer projectId={projectId} sources={sources} defaultMode={videoType === "desde_enlace" ? "link" : "text"} />

      <div className="mt-6 border-t border-white/6 pt-5">
        <Button
          className="bg-gradient-accent text-white hover:brightness-110"
          disabled={isGenerating || !canGenerate}
          onClick={handleGenerate}
        >
          {isGenerating ? t("ideaBox.generating") : t("ideaBox.generateButton")}
        </Button>
        {!hasIdea && <p className="mt-2 text-xs text-white/44">{t("ideaBox.missingIdea")}</p>}
        {hasIdea && hasPendingSource && <p className="mt-2 text-xs text-white/44">{t("ideaBox.waitingSources")}</p>}
        {hasIdea && !hasPendingSource && videoType === "desde_enlace" && !hasReadyLink && (
          <p className="mt-2 text-xs text-white/44">{t("ideaBox.missingLink")}</p>
        )}
        {generateError && <p className="mt-2 text-xs text-danger">{t(`ideaBox.generateErrors.${generateError}`)}</p>}
      </div>
    </div>
  );
}
