import { createClient } from "@/lib/supabase/server";

export async function getContentPlans() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_plans")
    .select("*, projects(title)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getContentPlanByProject(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_plans")
    .select("*")
    .eq("project_id", projectId)
    .single();

  if (error) return null;
  return data;
}
