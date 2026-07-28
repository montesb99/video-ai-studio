import { getTranslations } from "next-intl/server";
import { getProjectOrNotFound } from "../shared";

/** Stub del Sprint 3 — confirma que el guion quedó confirmado y los créditos retenidos. El resto (ElevenLabs real) es Sprint 4. */
export default async function VoicePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const t = await getTranslations("voice");
  await getProjectOrNotFound(projectId);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
      <div className="text-xl font-semibold">{t("title")}</div>
      <div className="max-w-sm text-sm text-white/44">{t("body")}</div>
    </div>
  );
}
