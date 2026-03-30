import { createClient } from "@/lib/supabase/server";

export async function getClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getClientsWithStats() {
  const supabase = await createClient();

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (clientsError) throw clientsError;

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("client_id, recurring_revenue, one_off_revenue, currency, status");

  if (projectsError) throw projectsError;

  return clients.map((client) => {
    const clientProjects = projects.filter((p) => p.client_id === client.id);
    // Use currency from the highest-MRR project, fallback to AUD
    const topProject = clientProjects.sort((a, b) => Number(b.recurring_revenue) - Number(a.recurring_revenue))[0];
    return {
      ...client,
      project_count: clientProjects.length,
      total_mrr: clientProjects.reduce((sum, p) => sum + Number(p.recurring_revenue), 0),
      total_one_off: clientProjects.reduce((sum, p) => sum + Number(p.one_off_revenue), 0),
      currency: topProject?.currency ?? "AUD",
    };
  });
}

export async function getClientById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
