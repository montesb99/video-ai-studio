"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { setCtaKeyword } from "../actions";

/** Mismo criterio que el servidor (docs §normalización): mayúsculas, sin diacríticos, solo letras — nunca se confía en esto, el servidor vuelve a normalizar. */
function normalizeClient(value: string): string {
  const stripped = Array.from(value.normalize("NFD"))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return !(code >= 0x0300 && code <= 0x036f);
    })
    .join("");
  return stripped.toUpperCase().replace(/[^A-Z]/g, "");
}

export function CtaKeywordPicker({
  projectId,
  scriptId,
  keyword,
  suggestions,
  disabled,
}: {
  projectId: string;
  scriptId: string;
  keyword: string;
  suggestions: string[];
  disabled?: boolean;
}) {
  const t = useTranslations("script.cta");
  const [value, setValue] = useState(keyword);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function commit(next: string) {
    const normalized = normalizeClient(next);
    setValue(normalized);
    setError(null);
    if (!normalized || normalized === keyword) return;
    startTransition(async () => {
      try {
        const result = await setCtaKeyword(projectId, scriptId, normalized);
        if (!result.ok) setError(result.reason);
      } catch {
        setError("not_found");
      }
    });
  }

  return (
    <div className="mt-3 border-t border-white/6 pt-3">
      <label htmlFor={`cta-keyword-${scriptId}`} className="mb-1 block text-[11px] font-medium text-white/68">
        {t("label")}
      </label>
      <Input
        id={`cta-keyword-${scriptId}`}
        value={value}
        disabled={disabled || isPending}
        onChange={(e) => setValue(normalizeClient(e.target.value))}
        onBlur={() => commit(value)}
        className="max-w-[200px]"
      />
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled || isPending}
            onClick={() => commit(suggestion)}
            className={`rounded-md border px-2 py-0.5 text-[11px] ${
              suggestion === value
                ? "border-[rgba(124,92,255,.5)] text-foreground"
                : "border-white/12 text-white/44"
            }`}
          >
            {suggestion}
          </button>
        ))}
      </div>
      {error && <p className="mt-1 text-[11px] text-danger">{t(`errors.${error}`)}</p>}
    </div>
  );
}
