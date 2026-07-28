"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { removeSource } from "../actions";
import type { SourceRow } from "../data";

const DOT: Record<string, string> = {
  pending: "bg-warning",
  ready: "bg-success",
  failed: "bg-danger",
};

const KNOWN_ERROR_CODES = new Set([
  "invalid_url",
  "blocked_ip",
  "dns_error",
  "unsupported_type",
  "too_large",
  "timeout",
  "http_error",
  "too_many_redirects",
  "social_requires_apify",
  "pdf_not_supported_yet",
  "empty_content",
  "unexpected_error",
]);

export function SourceChip({ projectId, source }: { projectId: string; source: SourceRow }) {
  const t = useTranslations("idea.source");
  const [isPending, startTransition] = useTransition();

  const label = source.url || t(`kindLabel.${source.kind}`);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/6 bg-surface-input py-1.5 pr-1.5 pl-3 text-xs">
      <span className={`h-1.5 w-1.5 flex-none rounded-full ${DOT[source.status] ?? "bg-white/24"}`} />
      <span className="max-w-[220px] truncate text-white/68" title={label}>
        {label}
      </span>
      {source.status === "pending" && <span className="text-white/44">{t("status.pending")}</span>}
      {source.status === "failed" && (
        <span className="text-danger">
          {t(
            `errors.${
              source.errorCode && KNOWN_ERROR_CODES.has(source.errorCode) ? source.errorCode : "unexpected_error"
            }`,
          )}
        </span>
      )}
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await removeSource(projectId, source.id);
            } catch {
              // silencioso: el chip simplemente no desaparece, el usuario puede reintentar
            }
          })
        }
        className="flex h-5 w-5 flex-none items-center justify-center rounded-full text-white/44 hover:bg-white/[0.06] hover:text-foreground"
        aria-label={t("remove")}
      >
        ×
      </button>
    </div>
  );
}
