import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Niche = { slug: string; label: string };

/** niches es de solo lectura pública (RLS: is_active) — cliente de sesión normal, no service role. */
export async function listNiches(): Promise<Niche[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("niches")
    .select("slug, label")
    .eq("is_active", true)
    .order("label");
  return data ?? [];
}
