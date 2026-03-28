import { notFound } from "next/navigation";
import { getContentPlanById } from "@/lib/queries/content-plans";
import { ContentPostClient } from "./content-post-client";

export default async function ContentPostPage({
  params,
}: {
  params: Promise<{ planId: string; postId: string }>;
}) {
  const { planId, postId } = await params;

  const plan = await getContentPlanById(planId);
  if (!plan) notFound();

  const project = (plan as Record<string, unknown>).projects as { title: string } | null;
  const planData = (plan.plan_data ?? []) as { month: string; topic: string; blogTitles?: string[] }[];
  const [monthIdx, titleIdx] = postId.split("-").map(Number);
  const monthPlan = planData[monthIdx];
  if (!monthPlan) notFound();

  const postTitle = monthPlan.blogTitles?.[titleIdx] ?? "Untitled Post";

  return (
    <ContentPostClient
      projectId={plan.project_id ?? planId}
      postId={postId}
      projectTitle={project?.title ?? "Content Plan"}
      postTitle={postTitle}
      monthName={monthPlan.month}
    />
  );
}
