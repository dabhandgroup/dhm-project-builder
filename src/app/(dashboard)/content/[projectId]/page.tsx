import { notFound } from "next/navigation";
import { getContentPlanByProject } from "@/lib/queries/content-plans";
import { getProjectById } from "@/lib/queries/projects";
import { ContentPlanDetailClient } from "./content-plan-client";

export default async function ContentPlanDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  let project;
  try {
    project = await getProjectById(projectId);
  } catch {
    notFound();
  }
  if (!project) notFound();

  const plan = await getContentPlanByProject(projectId);
  const planData = plan?.plan_data ?? [];

  return (
    <ContentPlanDetailClient
      projectId={projectId}
      projectTitle={project.title}
      planData={planData as unknown[]}
    />
  );
}
