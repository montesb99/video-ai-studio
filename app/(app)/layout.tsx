import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentWorkspaceId } from "@/lib/supabase/workspace";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Resuelto por workspace_members (mismo criterio que current_workspaces() de
  // RLS), no por workspaces.owner_id — un miembro invitado no-owner también
  // debe ver su saldo de créditos aquí.
  const workspaceId = await getCurrentWorkspaceId(supabase);

  const [{ data: profile }, { data: workspace }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    workspaceId
      ? supabase.from("workspaces").select("credits_balance").eq("id", workspaceId).single()
      : Promise.resolve({ data: null }),
  ]);

  const userName = profile?.full_name || user.email || "";
  const creditsBalance = workspace?.credits_balance ?? 0;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar creditsBalance={creditsBalance} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar userName={userName} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
