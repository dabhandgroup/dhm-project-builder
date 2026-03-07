import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban } from "lucide-react";
import { ProjectsViewToggle } from "./view-toggle";
import type { ProjectStatus } from "@/types/database";

export default async function ProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, domain_name, status, one_off_revenue, recurring_revenue, ai_model, preview_url, created_at, client_id, clients(name)")
    .neq("status", "draft")
    .order("created_at", { ascending: false });

  const formattedProjects = (projects ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    domain_name: p.domain_name,
    status: p.status as ProjectStatus,
    one_off_revenue: p.one_off_revenue,
    recurring_revenue: p.recurring_revenue,
    ai_model: p.ai_model,
    preview_url: p.preview_url,
    created_at: p.created_at,
    clientName: ((p.clients as { name: string }[])?.[0])?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Projects" description="Manage your website projects">
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </PageHeader>

      {formattedProjects.length === 0 ? (
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
        <ProjectsViewToggle projects={formattedProjects} />
      )}
    </div>
  );
}
