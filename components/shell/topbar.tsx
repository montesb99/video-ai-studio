"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/app/(auth)/actions";

const STEP_LABELS = [
  "1 Idea",
  "2 Propuestas",
  "3 Guion",
  "4 Voz",
  "5 Avatar y marca",
  "6 Escenas",
];

const CRUMBS: Record<string, string> = {
  "/dashboard": "Análisis / Rendimiento",
  "/create": "Creación / Nuevo video",
  "/library": "Análisis / Biblioteca",
  "/brand": "Configuración / Identidad de marca",
  "/templates": "Configuración / Plantillas",
  "/integrations": "Configuración / Integraciones",
  "/settings": "Configuración / Ajustes",
};

function crumbFor(pathname: string) {
  const match = Object.keys(CRUMBS).find((prefix) =>
    pathname.startsWith(prefix),
  );
  return match ? CRUMBS[match] : "";
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function TopBar({
  userName,
  step = 0,
}: {
  userName: string;
  step?: number;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const showStepper = step > 0;

  return (
    <div className="flex flex-none flex-col font-sans text-foreground">
      <div className="flex h-16 flex-none items-center justify-between gap-4 border-b border-white/6 bg-surface-base px-7">
        <div className="text-[13px] font-medium text-white/44">
          {crumbFor(pathname)}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-white/68 transition-colors hover:bg-white/6"
            aria-label="Notificaciones"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13.6 6.6a4.6 4.6 0 1 0-9.2 0c0 5-2 6.4-2 6.4h13.2s-2-1.4-2-6.4" />
              <path d="M10.3 15.4a1.5 1.5 0 0 1-2.6 0" />
            </svg>
            <span className="absolute right-2 top-[7px] h-[7px] w-[7px] rounded-full border-2 border-surface-base bg-brand-accent" />
          </button>

          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-white/68 transition-colors hover:bg-white/6"
            aria-label={t("settings")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="9" cy="9" r="2.6" />
              <path d="M14.6 11.1a1.2 1.2 0 0 0 .24 1.32l.05.04a1.44 1.44 0 1 1-2.04 2.04l-.04-.05a1.2 1.2 0 0 0-1.32-.24 1.2 1.2 0 0 0-.72 1.1v.13a1.44 1.44 0 1 1-2.88 0v-.07a1.2 1.2 0 0 0-.78-1.1 1.2 1.2 0 0 0-1.32.24l-.04.05a1.44 1.44 0 1 1-2.04-2.04l.05-.04a1.2 1.2 0 0 0 .24-1.32 1.2 1.2 0 0 0-1.1-.72H2.6a1.44 1.44 0 1 1 0-2.88h.07a1.2 1.2 0 0 0 1.1-.78 1.2 1.2 0 0 0-.24-1.32l-.05-.04A1.44 1.44 0 1 1 5.52 2.4l.04.05a1.2 1.2 0 0 0 1.32.24h.06a1.2 1.2 0 0 0 .72-1.1V1.5a1.44 1.44 0 1 1 2.88 0v.07a1.2 1.2 0 0 0 .72 1.1 1.2 1.2 0 0 0 1.32-.24l.04-.05a1.44 1.44 0 1 1 2.04 2.04l-.05.04a1.2 1.2 0 0 0-.24 1.32v.06a1.2 1.2 0 0 0 1.1.72h.13a1.44 1.44 0 1 1 0 2.88h-.07a1.2 1.2 0 0 0-1.1.72" />
            </svg>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-[38px] items-center gap-2.5 rounded-full border border-white/10 bg-surface-panel py-0 pl-1.5 pr-3 transition-colors hover:border-white/16">
              <span
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-semibold text-[#0B0B10]"
                style={{
                  background: "linear-gradient(135deg,#5B3FD6,#B06AF0)",
                }}
              >
                {initialsOf(userName)}
              </span>
              <span className="text-[13px] font-medium">{userName}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="rgba(244,244,248,.44)"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M3 4.5 6 7.5 9 4.5" />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                {t("settings")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOutAction()}>
                {t("signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {showStepper && (
        <div className="flex items-start justify-center gap-0 border-b border-white/6 bg-surface-base px-7 py-[22px] pb-[18px]">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            const isLast = i === STEP_LABELS.length - 1;
            return (
              <div
                key={label}
                className="flex min-w-0 items-start"
                style={{ flex: isLast ? "0 0 96px" : "1 1 0" }}
              >
                <div className="flex w-24 flex-none flex-col items-center gap-2">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold"
                    style={{
                      border: `1.5px solid ${done || active ? "#7C5CFF" : "rgba(255,255,255,.16)"}`,
                      background: done
                        ? "#7C5CFF"
                        : active
                          ? "rgba(124,92,255,.14)"
                          : "transparent",
                      color: done
                        ? "#0B0B10"
                        : active
                          ? "#F4F4F8"
                          : "rgba(244,244,248,.44)",
                      boxShadow: active
                        ? "0 0 0 1px rgba(124,92,255,.45), 0 0 24px rgba(124,92,255,.18)"
                        : "none",
                    }}
                  >
                    {done ? "✓" : n}
                  </div>
                  <div
                    className="whitespace-nowrap text-xs"
                    style={{
                      fontWeight: active ? 600 : 500,
                      color: active
                        ? "#F4F4F8"
                        : done
                          ? "rgba(244,244,248,.68)"
                          : "rgba(244,244,248,.44)",
                    }}
                  >
                    {label}
                  </div>
                </div>
                <div
                  className="mt-[15.5px] h-[1.5px] flex-1"
                  style={{
                    minWidth: 24,
                    background: done ? "#7C5CFF" : "rgba(255,255,255,.10)",
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
