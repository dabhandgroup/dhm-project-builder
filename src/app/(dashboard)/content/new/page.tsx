import { getProjects } from "@/lib/queries/projects";
import { getClients } from "@/lib/queries/clients";
import { NewContentPlanClient } from "./new-content-plan-client";

export const dynamic = "force-dynamic";

export default async function NewContentPlanPage() {
  const [projects, clients] = await Promise.all([getProjects(), getClients()]);

  const projectOptions = projects.map((p) => ({
    id: p.id,
    title: p.title,
    client_id: p.client_id,
  }));

  const clientOptions = clients.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    company: c.company,
  }));

  return <NewContentPlanClient projects={projectOptions} clients={clientOptions} />;
}
