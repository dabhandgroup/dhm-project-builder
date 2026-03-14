import { createClient } from "@/lib/supabase/server";

export async function getVoiceMemos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("voice_memos")
    .select("*, projects(title)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getVoiceMemosByProject(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("voice_memos")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
