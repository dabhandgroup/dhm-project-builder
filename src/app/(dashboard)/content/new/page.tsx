import { getProjects } from "@/lib/queries/projects";
import { NewContentPlanClient } from "./new-content-plan-client";

export const dynamic = "force-dynamic";

export default async function NewContentPlanPage() {
  const projects = await getProjects();

  const projectOptions = projects.map((p) => ({
    id: p.id,
    title: p.title,
  }));

  return <NewContentPlanClient projects={projectOptions} />;
}
