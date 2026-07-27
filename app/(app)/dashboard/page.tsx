import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const t = await getTranslations("dash");

  return (
    <div className="p-7 pb-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </div>
          <div className="mt-1 text-sm text-white/68">{t("subtitle")}</div>
        </div>
        <Link
          href="/create"
          className="flex h-[38px] items-center gap-1.5 rounded-[10px] bg-gradient-accent px-4 text-[13px] font-semibold text-[#0B0B10] transition-[filter] hover:brightness-110"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M7 2.6v8.8M2.6 7h8.8" />
          </svg>
          {t("create")}
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/6 bg-surface-panel px-8 py-20 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-accent/14">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7C5CFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="#7C5CFF" stroke="none" />
          </svg>
        </div>
        <div className="text-base font-semibold">{t("empty.title")}</div>
        <p className="mt-2 max-w-sm text-sm text-white/68">
          {t("empty.body")}
        </p>
        <Link
          href="/integrations"
          className="mt-6 flex h-10 items-center rounded-[10px] bg-gradient-accent px-5 text-[13px] font-semibold text-[#0B0B10] transition-[filter] hover:brightness-110"
        >
          {t("empty.cta")}
        </Link>
      </div>
    </div>
  );
}
