import { createClient } from "@/lib/supabase/server";

export async function getCosts(currency?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("costs")
    .select("*, projects(title)")
    .order("date", { ascending: false });

  if (currency) {
    query = query.eq("currency", currency);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getFinancialTargets(currency?: string) {
  const supabase = await createClient();
  let query = supabase.from("financial_targets").select("*");

  if (currency) {
    query = query.eq("currency", currency);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getRevenueByProject(currency?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select("id, title, one_off_revenue, recurring_revenue, currency, status, clients(name), created_at");

  if (currency) {
    query = query.eq("currency", currency);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((p) => ({
    ...p,
    // Include in financials if status is complete (or any non-lead/draft status with revenue)
    include_in_financials: p.status === "complete" || p.status === "awaiting_payment",
    clients: Array.isArray(p.clients) ? p.clients[0] ?? null : p.clients ?? null,
  }));
}

export async function getFinancialSummary(currency?: string) {
  const projects = await getRevenueByProject(currency);
  const costs = await getCosts(currency);
  const targets = await getFinancialTargets(currency);

  const includedProjects = projects.filter((p) => p.include_in_financials);
  const totalMRR = includedProjects.reduce((sum, p) => sum + Number(p.recurring_revenue), 0);
  const totalOneOff = includedProjects.reduce((sum, p) => sum + Number(p.one_off_revenue), 0);
  const monthlyCosts = costs
    .filter((c) => c.type === "monthly")
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const oneOffCosts = costs
    .filter((c) => c.type === "one_off")
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    totalMRR,
    totalOneOff,
    monthlyCosts,
    oneOffCosts,
    netProfit: totalMRR - monthlyCosts,
    totalProfit: totalMRR + totalOneOff - monthlyCosts - oneOffCosts,
    projects,
    costs,
    targets,
  };
}
