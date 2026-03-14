import { notFound } from "next/navigation";
import { getContentPlanByProject } from "@/lib/queries/content-plans";
import { getProjectById } from "@/lib/queries/projects";
import { ContentPostClient } from "./content-post-client";

export default async function ContentPostPage({
  params,
}: {
  params: Promise<{ projectId: string; postId: string }>;
}) {
  const { projectId, postId } = await params;

  let project;
  try {
    project = await getProjectById(projectId);
  } catch {
    notFound();
  }
  if (!project) notFound();

  const plan = await getContentPlanByProject(projectId);
  if (!plan) notFound();

  const planData = (plan.plan_data ?? []) as { month: string; topic: string; blogTitles?: string[] }[];
  const [monthIdx, titleIdx] = postId.split("-").map(Number);
  const monthPlan = planData[monthIdx];
  if (!monthPlan) notFound();

  const postTitle = monthPlan.blogTitles?.[titleIdx] ?? "Untitled Post";

  return (
    <ContentPostClient
      projectId={projectId}
      postId={postId}
      projectTitle={project.title}
      postTitle={postTitle}
      monthName={monthPlan.month}
    />
  );
}
