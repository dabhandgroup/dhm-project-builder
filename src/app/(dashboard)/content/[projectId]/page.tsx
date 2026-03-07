import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import { getContentPlanByProjectId, getProjectById } from "@/lib/mock-data";

interface MonthPlan {
  month: string;
  topic: string;
  keywords: string[];
  locations: string[];
  notes: string;
}

export default async function ContentPlanDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const plan = getContentPlanByProjectId(projectId);

  if (!plan) notFound();

  const project = getProjectById(plan.project_id);
  const planData = (plan.plan_data as MonthPlan[]) ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Content Plan"
        description={project?.title ?? ""}
      >
        {plan.google_sheet_url && (
          <a href={plan.google_sheet_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4" />
              Google Sheet
            </Button>
          </a>
        )}
        {plan.google_doc_url && (
          <a href={plan.google_doc_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4" />
              Project Summary
            </Button>
          </a>
        )}
      </PageHeader>

      {planData.length === 0 ? (
        <p className="text-sm text-muted-foreground">No content plan data available.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {planData.map((month, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{month.month}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="font-medium">{month.topic}</p>
                {month.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {month.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded bg-secondary px-1.5 py-0.5"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
                {month.notes && (
                  <p className="text-muted-foreground">{month.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
