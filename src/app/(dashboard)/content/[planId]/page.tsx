import { notFound } from "next/navigation";
import { getContentPlanById } from "@/lib/queries/content-plans";
import { ContentPlanDetailClient } from "./content-plan-client";

export default async function ContentPlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;

  const plan = await getContentPlanById(planId);
  if (!plan) notFound();

  const project = (plan as Record<string, unknown>).projects as { title: string } | null;
  const planData = plan.plan_data ?? [];

  return (
    <ContentPlanDetailClient
      projectId={plan.project_id ?? planId}
      planId={planId}
      projectTitle={project?.title ?? "Content Plan"}
      planData={planData as unknown[]}
    />
  );
}
