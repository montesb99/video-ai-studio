"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type NavItem = {
  key: "home" | "create" | "library" | "brand" | "templates" | "integrations";
  href: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "home",
    href: "/dashboard",
    icon: (
      <path d="M2.6 7.2 9 2.4l6.4 4.8v7.2a1.2 1.2 0 0 1-1.2 1.2H3.8a1.2 1.2 0 0 1-1.2-1.2z M7 15.6V9h4v6.6" />
    ),
  },
  {
    key: "create",
    href: "/create",
    icon: (
      <>
        <rect x="2.2" y="4.2" width="9.6" height="9.6" rx="2" />
        <path d="M11.8 8.2 15.8 5.8v6.4l-4-2.4z M7 7.4v3.2M5.4 9h3.2" />
      </>
    ),
  },
  {
    key: "library",
    href: "/library",
    icon: (
      <path d="M2.2 5.4a1.6 1.6 0 0 1 1.6-1.6h2.6l1.4 1.8h6.4a1.6 1.6 0 0 1 1.6 1.6v5.4a1.6 1.6 0 0 1-1.6 1.6H3.8a1.6 1.6 0 0 1-1.6-1.6z" />
    ),
  },
  {
    key: "brand",
    href: "/brand",
    icon: (
      <>
        <path d="M8.6 2.4H3.6a1.2 1.2 0 0 0-1.2 1.2v5l7 7a1.2 1.2 0 0 0 1.7 0l4.3-4.3a1.2 1.2 0 0 0 0-1.7z" />
        <circle cx="5.9" cy="5.9" r="1" />
      </>
    ),
  },
  {
    key: "templates",
    href: "/templates",
    icon: (
      <>
        <rect x="2.4" y="2.4" width="5.6" height="5.6" rx="1.4" />
        <rect x="10" y="2.4" width="5.6" height="5.6" rx="1.4" />
        <rect x="2.4" y="10" width="5.6" height="5.6" rx="1.4" />
        <rect x="10" y="10" width="5.6" height="5.6" rx="1.4" />
      </>
    ),
  },
  {
    key: "integrations",
    href: "/integrations",
    icon: (
      <path d="M6.6 2.6h4.8v2.2a1.4 1.4 0 1 0 2.8 0h1.2v4.8h-2.2a1.4 1.4 0 1 0 0 2.8v2.2H6.6v-2.2a1.4 1.4 0 1 1-2.8 0H2.6V7.4h2.2a1.4 1.4 0 1 0 0-2.8H6.6z" />
    ),
  },
];

export function Sidebar({ creditsBalance }: { creditsBalance: number }) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <div className="flex h-full w-[232px] flex-none flex-col overflow-hidden border-r border-white/6 bg-surface-panel text-foreground">
      <div className="flex h-16 flex-none items-center gap-2.5 border-b border-white/6 px-5">
        <div className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-gradient-accent">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 1.6 11.4 7 3 12.4z" fill="#0B0B10" />
          </svg>
        </div>
        <div className="text-[15px] font-semibold tracking-tight">
          Video AI Studio
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className="flex h-10 items-center gap-[11px] rounded-[10px] px-3 text-sm transition-colors hover:bg-white/4"
              style={{
                fontWeight: active ? 600 : 500,
                color: active ? "#F4F4F8" : "rgba(244,244,248,.68)",
                background: active ? "rgba(124,92,255,.14)" : "transparent",
                boxShadow: active ? "inset 2px 0 0 0 #7C5CFF" : "none",
              }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {item.icon}
              </svg>
              <span>{t(item.key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 mt-1.5 rounded-[14px] border border-white/6 bg-surface-input p-3.5">
        <div className="mb-2 text-xs font-medium text-white/68">
          {t("credits")}
        </div>
        <div className="mb-2.5 flex items-baseline gap-1">
          <span className="text-xl font-semibold tracking-tight">
            {creditsBalance.toLocaleString("es-PE")}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-accent"
            style={{ width: creditsBalance > 0 ? "42%" : "0%" }}
          />
        </div>
      </div>

      <div className="mt-auto p-4">
        <div
          className="rounded-2xl border border-white/6 p-4"
          style={{
            background:
              "linear-gradient(160deg, rgba(124,92,255,.14), rgba(19,19,32,0))",
          }}
        >
          <div className="mb-2 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="#B06AF0">
              <path d="M8 1.6 10.2 6l4.4.5-3.3 3 .9 4.4L8 11.8 3.8 13.9l.9-4.4-3.3-3L5.8 6z" />
            </svg>
            <span className="text-sm font-semibold">{t("upgradeTitle")}</span>
          </div>
          <div className="mb-3 text-xs leading-[18px] text-white/44">
            {t("upgradeBody")}
          </div>
          <div className="flex h-[38px] cursor-pointer items-center justify-center rounded-[10px] bg-gradient-accent text-[13px] font-semibold text-[#0B0B10] transition-[filter] hover:brightness-110">
            {t("upgradeCta")}
          </div>
        </div>
      </div>
    </div>
  );
}
