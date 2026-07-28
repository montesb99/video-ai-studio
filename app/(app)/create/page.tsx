import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/supabase/workspace";

/**
 * Sin UI propia — crea el proyecto en 'draft' y redirige al primer paso del
 * wizard. input_sources.project_id es not null (el usuario adjunta fuentes
 * antes de generar ideas) y docs/04-UX-FLOWS.md confirma que el estado del
 * wizard vive en BD, no en el cliente: el id tiene que existir desde el
 * arranque, no recién tras el primer input.
 */
export default async function CreateEntryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await getCurrentWorkspaceId(supabase);
  if (!workspaceId) redirect("/login");

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      workspace_id: workspaceId,
      created_by: user.id,
      video_type: "informativo",
      status: "draft",
      current_step: 1,
    })
    .select("id")
    .single();

  if (error || !project) {
    const t = await getTranslations("wizard.createError");
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
        <div className="text-xl font-semibold">{t("title")}</div>
        <div className="text-sm text-white/44">{t("body")}</div>
      </div>
    );
  }

  redirect(`/create/${project.id}/idea`);
}
