import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderKanban } from "lucide-react";
import { ProjectsViewToggle } from "./view-toggle";
import { getProjects } from "@/lib/queries/projects";
import type { ProjectStatus } from "@/types/database";

async function ProjectsList() {
  const projects = await getProjects();

  const formattedProjects = projects.map((p) => ({
    id: p.id,
    title: p.title,
    domain_name: p.domain_name,
    status: p.status as ProjectStatus,
    one_off_revenue: Number(p.one_off_revenue),
    recurring_revenue: Number(p.recurring_revenue),
    ai_model: p.ai_model,
    preview_url: p.preview_url,
    currency: p.currency ?? "AUD",
    created_at: p.created_at,
    clientName: (p as Record<string, unknown>).clients
      ? ((p as Record<string, unknown>).clients as { name: string })?.name ?? ""
      : "",
  }));

  if (formattedProjects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create your first project to get started."
      >
        <Link href="/">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </EmptyState>
    );
  }

  return <ProjectsViewToggle projects={formattedProjects} />;
}

function ProjectsListLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40 rounded-lg" />
      ))}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader title="Projects">
        <Link href="/">
          <Button>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </PageHeader>

      <Suspense fallback={<ProjectsListLoading />}>
        <ProjectsList />
      </Suspense>
    </div>
  );
}
