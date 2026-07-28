import { getTranslations } from "next-intl/server";
import { getScriptScreenData } from "./data";
import { ScriptEditor } from "./_components/script-editor";
import { GenerateScriptButton } from "./_components/generate-script-button";
import { VersionList } from "./_components/version-list";

export const maxDuration = 60;

export default async function ScriptPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const t = await getTranslations("script");
  const { project, script, scriptVersions, selectedProposal, ctaSuggestions } = await getScriptScreenData(projectId);

  return (
    <div className="mx-auto max-w-2xl p-7 pb-16">
      <div className="mb-6">
        <div className="text-2xl font-semibold tracking-tight">{t("title")}</div>
        <div className="mt-1 text-sm text-white/68">{t("subtitle")}</div>
      </div>

      {script ? (
        <>
          <ScriptEditor
            key={script.id}
            projectId={projectId}
            script={script}
            targetSeconds={project.targetSeconds}
            ctaSuggestions={ctaSuggestions}
          />
          <VersionList versions={scriptVersions} />
        </>
      ) : (
        <GenerateScriptButton projectId={projectId} disabled={!selectedProposal} />
      )}
    </div>
  );
}
