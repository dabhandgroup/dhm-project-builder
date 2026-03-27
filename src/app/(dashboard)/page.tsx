import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, FolderKanban } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { projectStatuses } from "@/constants/project-statuses";
import { getProjects } from "@/lib/queries/projects";
import type { ProjectStatus } from "@/types/database";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

async function RecentProjects() {
  const projects = await getProjects();
  const recentProjects = projects
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
        <CardDescription>Your latest projects</CardDescription>
      </CardHeader>
      <CardContent>
        {recentProjects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to get started."
          >
            <Link href="/projects/new">
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </Link>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {recentProjects.map((project) => {
              const statusConfig = projectStatuses[project.status as ProjectStatus];
              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors gap-1.5 sm:gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {project.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.domain_name || "No domain"} &middot;{" "}
                      {formatDate(project.created_at)}
                    </p>
                  </div>
                  <Badge
                    className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0 shrink-0 w-fit`}
                  >
                    {statusConfig.label}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentProjectsLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
        <CardDescription>Your latest projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Dashboard">
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Cards — shows cached numbers instantly, animates to fresh */}
      <DashboardStats />

      {/* Recent Projects - streams in via server */}
      <Suspense fallback={<RecentProjectsLoading />}>
        <RecentProjects />
      </Suspense>
    </div>
  );
}
