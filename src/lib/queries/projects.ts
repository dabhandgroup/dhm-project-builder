import { createClient } from "@/lib/supabase/server";

export async function getProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .order("kanban_order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getProjectById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*), project_images(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getProjectsByStatus(status: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .eq("status", status)
    .order("kanban_order", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getProjectCountByStatus() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("status");

  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const row of data) {
    counts[row.status] = (counts[row.status] || 0) + 1;
  }
  return counts;
}

export async function getRecentProjects(limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getProjectsByClientId(clientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
