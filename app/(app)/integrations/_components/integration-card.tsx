"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  disconnectIntegration,
  saveIntegrationKey,
  verifyIntegration,
  type IntegrationActionResult,
  type IntegrationProvider,
} from "../actions";
import type { CatalogCounts, IntegrationSummary } from "../data";

const STATUS_DOT: Record<string, string> = {
  active: "bg-success",
  invalid: "bg-danger",
  expired: "bg-danger",
  unverified: "bg-white/24",
  not_connected: "bg-white/24",
};

function statusKey(
  summary: IntegrationSummary | undefined,
  result: IntegrationActionResult | null,
  providerName: string,
): { dot: string; labelKey: string; params?: Record<string, string> } {
  const amber = result && result.ok ? result.amber : undefined;
  const status = result && result.ok ? result.status : summary?.status;
  const missingPermission = result && result.ok ? result.missingPermission : undefined;

  if (amber === "no_credits") {
    return { dot: "bg-warning", labelKey: "status.noCredits", params: { provider: providerName } };
  }
  if (amber === "rate_limited") return { dot: "bg-warning", labelKey: "status.rateLimited" };
  if (!status) return { dot: STATUS_DOT.not_connected, labelKey: "status.notConnected" };
  if (status === "invalid" && missingPermission) {
    return { dot: STATUS_DOT.invalid, labelKey: "missingPermission", params: { permission: missingPermission } };
  }
  return { dot: STATUS_DOT[status] ?? STATUS_DOT.not_connected, labelKey: `status.${status}` };
}

/**
 * docs/06-COPY-ES.md §12 ("Verificado hace {time}") y docs/04-UX-FLOWS.md
 * (mockup: "Verificado hace 2 h") piden tiempo relativo, no fecha/hora
 * absoluta — y en formato local (docs/05-DESIGN-TOKENS.md §3: "hace 2 h",
 * "hace 4 min").
 */
function formatVerifiedAgo(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "un momento";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  return `${Math.round(diffH / 24)} d`;
}

export function IntegrationCard({
  provider,
  summary,
  heygenActive = false,
  catalogCounts,
}: {
  provider: IntegrationProvider;
  summary: IntegrationSummary | undefined;
  /** Solo relevante para la tarjeta de ElevenLabs: oculta el panel guiado de vinculación hasta que HeyGen también esté conectado. */
  heygenActive?: boolean;
  catalogCounts?: CatalogCounts;
}) {
  const t = useTranslations("integrations");
  const [formOpen, setFormOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [lastResult, setLastResult] = useState<IntegrationActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const isConnected = Boolean(summary);
  const { dot, labelKey, params } = statusKey(summary, lastResult, t(`providers.${provider}.name`));

  const catalogLine =
    isConnected && summary?.status === "active" && catalogCounts
      ? provider === "elevenlabs"
        ? t("counts.voices", { total: catalogCounts.voicesTotal, cloned: catalogCounts.voicesCloned })
        : provider === "heygen"
          ? typeof summary.scopesJson?.remainingQuota === "number"
            ? t("counts.avatarsWithCredits", {
                total: catalogCounts.avatarsTotal,
                credits: Math.round(summary.scopesJson.remainingQuota as number).toLocaleString("es"),
              })
            : t("counts.avatars", { total: catalogCounts.avatarsTotal })
          : null
      : null;

  // Las tres acciones son Server Actions sobre la red: si la promesa
  // rechaza (timeout, KEK mal configurada, etc.) sin este try/catch sería un
  // unhandled rejection fuera del ciclo de render — isPending vuelve a false
  // pero el usuario no ve ningún mensaje, ni de éxito ni de error.
  function handleConnect() {
    startTransition(async () => {
      try {
        const result = await saveIntegrationKey(provider, apiKey);
        setLastResult(result);
        if (result.ok) {
          setApiKey("");
          setFormOpen(false);
        }
      } catch {
        setLastResult({ ok: false, reason: "unexpected_error" });
      }
    });
  }

  function handleVerify() {
    startTransition(async () => {
      try {
        const result = await verifyIntegration(provider);
        setLastResult(result);
      } catch {
        setLastResult({ ok: false, reason: "unexpected_error" });
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      try {
        await disconnectIntegration(provider);
        setLastResult(null);
      } catch {
        setLastResult({ ok: false, reason: "unexpected_error" });
      }
    });
  }

  return (
    <div className="rounded-2xl border border-white/6 bg-surface-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">{t(`providers.${provider}.name`)}</div>
          <div className="mt-0.5 text-[13px] text-white/68">
            {t(`providers.${provider}.description`)}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <span className="text-white/68">{t(labelKey, params)}</span>
        </div>
      </div>

      {isConnected && summary && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/44">
          {summary.lastFour && <span>{t("lastFour", { lastFour: summary.lastFour })}</span>}
          {summary.lastVerifiedAt && (
            <span>{t("verifiedAt", { time: formatVerifiedAgo(summary.lastVerifiedAt) })}</span>
          )}
        </div>
      )}

      {catalogLine && <div className="mt-1 text-xs text-white/44">{catalogLine}</div>}

      {isConnected && provider === "elevenlabs" && heygenActive && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={`h-1.5 w-1.5 rounded-full ${summary?.linkedJson?.linkedToHeygen ? "bg-success" : "bg-white/24"}`}
          />
          <span className="text-white/44">
            {t(summary?.linkedJson?.linkedToHeygen ? "voiceLink.linked" : "voiceLink.notLinked")}
          </span>
        </div>
      )}

      {isConnected &&
        provider === "elevenlabs" &&
        heygenActive &&
        summary?.status === "active" &&
        !summary?.linkedJson?.linkedToHeygen && (
          <div className="mt-4 space-y-2 rounded-xl border border-white/6 bg-white/[0.02] p-3">
            <p className="text-xs font-medium text-white/68">{t("voiceLink.guided.title")}</p>
            <p className="text-xs text-white/44">{t("voiceLink.guided.body")}</p>
            <ol className="list-decimal space-y-1 pl-4 text-xs text-white/44">
              <li>{t("voiceLink.guided.step1")}</li>
              <li>{t("voiceLink.guided.step2")}</li>
              <li>{t("voiceLink.guided.step3")}</li>
            </ol>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="https://elevenlabs.io/app/settings/api-keys"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/12 px-2.5 py-1 text-xs text-white/68 hover:bg-white/[0.04]"
              >
                {t("voiceLink.guided.openElevenlabs")}
              </a>
              <a
                href="https://app.heygen.com/"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/12 px-2.5 py-1 text-xs text-white/68 hover:bg-white/[0.04]"
              >
                {t("voiceLink.guided.openHeygen")}
              </a>
              <Button size="sm" variant="outline" disabled={isPending} onClick={handleVerify}>
                {t("voiceLink.guided.confirm")}
              </Button>
            </div>
          </div>
        )}

      {!isConnected && !formOpen && (
        <Button
          className="mt-4 bg-gradient-accent text-white hover:brightness-110"
          size="sm"
          onClick={() => setFormOpen(true)}
        >
          {t("actions.connect")}
        </Button>
      )}

      {isConnected && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleVerify}>
            {t("actions.verify")}
          </Button>
          <Button variant="ghost" size="sm" disabled={isPending} onClick={handleDisconnect}>
            {t("actions.disconnect")}
          </Button>
        </div>
      )}

      {formOpen && (
        <div className="mt-4 space-y-2 border-t border-white/6 pt-4">
          <Label htmlFor={`key-${provider}`} className="text-xs font-medium text-white/68">
            {t("dialog.label")}
          </Label>
          <p id={`key-${provider}-help`} className="text-xs text-white/44">
            {t("dialog.body")}
          </p>
          <Input
            id={`key-${provider}`}
            type="password"
            autoComplete="off"
            placeholder={t("dialog.placeholder")}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isPending}
            aria-describedby={`key-${provider}-help`}
          />
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="bg-gradient-accent text-white hover:brightness-110"
              disabled={isPending || !apiKey.trim()}
              onClick={handleConnect}
            >
              {isPending ? t("dialog.submitting") : t("actions.save")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => {
                setFormOpen(false);
                setApiKey("");
              }}
            >
              {t("actions.cancel")}
            </Button>
          </div>
        </div>
      )}

      {lastResult && !lastResult.ok && (
        <p className="mt-3 text-xs text-danger">{t(`errors.${lastResult.reason}`)}</p>
      )}
    </div>
  );
}
