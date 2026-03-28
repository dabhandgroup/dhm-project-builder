import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PenTool, Plus, FileText, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getContentPlans } from "@/lib/queries/content-plans";

async function ContentList() {
  const plans = await getContentPlans();

  if (plans.length === 0) {
    return (
      <EmptyState
        icon={PenTool}
        title="No content plans yet"
        description="Generate a 12-month content plan for your clients."
      >
        <Link href="/content/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Create Content Plan
          </Button>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">
      {plans.map((plan) => {
        const project = (plan as Record<string, unknown>).projects as { title: string } | null;
        const projectTitle = project?.title ?? "Standalone Plan";
        const planData = plan.plan_data as { month: string; topic: string; blogTitles?: string[] }[];
        const totalPosts = Array.isArray(planData)
          ? planData.reduce((sum, m) => sum + (m.blogTitles?.length ?? 0), 0)
          : 0;
        const totalMonths = Array.isArray(planData) ? planData.length : 0;

        return (
          <Link key={plan.id} href={`/content/${plan.id}`} className="block">
            <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {projectTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totalPosts} posts across {totalMonths} months &middot; {formatDate(plan.created_at)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

function ContentListLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  );
}

export default function ContentPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Content">
        <Link href="/content/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Plan
          </Button>
        </Link>
      </PageHeader>

      <Suspense fallback={<ContentListLoading />}>
        <ContentList />
      </Suspense>
    </div>
  );
}
