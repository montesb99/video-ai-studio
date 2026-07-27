import { useTranslations } from "next-intl";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-surface-base px-4">
      <div className="w-full max-w-[380px]">
        <Brand />
        <div className="rounded-2xl border border-white/6 bg-surface-panel p-7 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}

function Brand() {
  const t = useTranslations("auth");
  return (
    <div className="mb-7 flex items-center justify-center gap-2.5">
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-gradient-accent">
        <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
          <path d="M3 1.6 11.4 7 3 12.4z" fill="#0B0B10" />
        </svg>
      </div>
      <div className="text-[16px] font-semibold tracking-tight text-foreground">
        {t("brandTitle")}
      </div>
    </div>
  );
}
