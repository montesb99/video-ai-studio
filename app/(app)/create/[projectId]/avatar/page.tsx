import { getTranslations } from "next-intl/server";
import { getAvatarScreenData } from "./data";
import { AvatarComposer } from "./_components/avatar-composer";

// runGenerateAvatarStart solo DISPARA el render (sube audio + crea el video)
// y devuelve — no espera a que termine, eso lo hace el sondeo del cliente.
// 60s por defecto alcanza de sobra para esas dos llamadas.
export const maxDuration = 60;

export default async function AvatarPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const t = await getTranslations("avatar");
  const data = await getAvatarScreenData(projectId);

  return (
    <div className="mx-auto max-w-2xl p-7 pb-16">
      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight">{t("title")}</div>
        <div className="mt-1 text-sm text-white/68">{t("subtitle")}</div>
      </div>

      <AvatarComposer
        projectId={projectId}
        avatars={data.avatars}
        initialAvatarId={data.selectedAvatarId}
        initialLookId={data.selectedLookId}
        activeRenderJob={data.activeRenderJob}
        resultVideoUrl={data.resultVideoUrl}
        lastFailureCode={data.lastFailureCode}
        voiceApproved={data.voiceApproved}
      />
    </div>
  );
}
