import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/queries/projects";
import { getClients } from "@/lib/queries/clients";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [projects, clients] = await Promise.all([
    getProjects(),
    getClients(),
  ]);

  const totalProjects = projects.length;
  const inProgress = projects.filter(
    (p) => p.status !== "complete" && p.status !== "lead"
  ).length;
  const totalMRR = projects
    .filter((p) => p.include_in_financials)
    .reduce((sum, p) => sum + Number(p.recurring_revenue ?? 0), 0);
  const activeClients = clients.length;

  return NextResponse.json({ totalProjects, inProgress, totalMRR, activeClients });
}
