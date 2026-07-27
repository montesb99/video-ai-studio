import { getTranslations } from "next-intl/server";

export async function ComingSoon({ title }: { title: string }) {
  const t = await getTranslations("common");
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
      <div className="text-xl font-semibold">{title}</div>
      <div className="text-sm text-white/44">{t("comingSoon")}</div>
    </div>
  );
}
