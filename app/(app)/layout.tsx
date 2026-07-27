import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const [{ data: profile }, { data: workspace }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("workspaces")
      .select("credits_balance")
      .eq("owner_id", user.id)
      .limit(1)
      .single(),
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
