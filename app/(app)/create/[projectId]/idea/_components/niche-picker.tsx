"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { setNiche } from "../actions";
import type { Niche } from "@/lib/pipeline/niches";

export function NichePicker({
  projectId,
  niches,
  value,
}: {
  projectId: string;
  niches: Niche[];
  value: string | null;
}) {
  const t = useTranslations("idea.niche");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="mb-6">
      <label htmlFor="niche" className="mb-2 block text-xs font-medium text-white/68">
        {t("label")}
      </label>
      <select
        id="niche"
        disabled={isPending}
        value={value ?? ""}
        onChange={(e) => {
          const next = e.target.value || null;
          startTransition(() => {
            setNiche(projectId, next).catch(() => null);
          });
        }}
        className="h-9 w-full max-w-sm rounded-lg border border-white/12 bg-surface-input px-3 text-sm text-foreground outline-none focus-visible:border-ring"
      >
        <option value="">{t("auto")}</option>
        {niches.map((niche) => (
          <option key={niche.slug} value={niche.slug}>
            {niche.label}
          </option>
        ))}
      </select>
    </div>
  );
}
