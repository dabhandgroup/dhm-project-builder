import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function ContentPage() {
  const supabase = await createClient();

  const { data: contentPlans } = await supabase
    .from("content_plans")
    .select("*, projects(title)")
    .order("created_at", { ascending: false });

  const plans = contentPlans ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Creation"
        description="SEO content plans for your clients"
      >
        <Button variant="outline" disabled>
          <Plus className="h-4 w-4" />
          Generate New Plan
        </Button>
      </PageHeader>

      {plans.length === 0 ? (
        <EmptyState
          icon={PenTool}
          title="No content plans yet"
          description="Generate a 12-month content plan from a project's details to upsell SEO services."
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const project = plan.projects as { title: string } | null;
            return (
              <Link key={plan.id} href={`/content/${plan.project_id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {project?.title ?? "Unknown Project"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(plan.created_at)}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs">
                      {plan.google_sheet_url && (
                        <a
                          href={plan.google_sheet_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Sheet
                        </a>
                      )}
                      {plan.google_doc_url && (
                        <a
                          href={plan.google_doc_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Doc
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
