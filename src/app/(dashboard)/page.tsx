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
import { Plus, FolderKanban, DollarSign, Users, Gauge } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { projectStatuses } from "@/constants/project-statuses";
import { getProjects } from "@/lib/queries/projects";
import { getClients } from "@/lib/queries/clients";
import type { ProjectStatus } from "@/types/database";

function StatCardShell({
  label,
  icon: Icon,
  href,
  children,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group">
      <Card className="transition-colors group-hover:bg-accent/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">{label}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </Link>
  );
}

function StatValue({ className }: { className?: string }) {
  return <Skeleton className={`h-7 w-12 ${className ?? ""}`} />;
}

async function DashboardStats() {
  const [projects, clients] = await Promise.all([
    getProjects(),
    getClients(),
  ]);

  const clientCount = clients.length;
  const activeProjects = projects.filter((p) => p.status !== "complete" && p.status !== "lead");
  const totalMRR = projects.reduce((sum, p) => sum + Number(p.recurring_revenue ?? 0), 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
        <StatCardShell label="Total Projects" icon={FolderKanban} href="/projects">
          <div className="text-xl sm:text-2xl font-bold">{projects.length}</div>
        </StatCardShell>
        <StatCardShell label="In Progress" icon={Gauge} href="/projects">
          <div className="text-xl sm:text-2xl font-bold">{activeProjects.length}</div>
        </StatCardShell>
        <StatCardShell label="Monthly Revenue" icon={DollarSign} href="/financials">
          <div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalMRR)}</div>
        </StatCardShell>
        <StatCardShell label="Active Clients" icon={Users} href="/clients">
          <div className="text-xl sm:text-2xl font-bold">{clientCount}</div>
        </StatCardShell>
      </div>
    </>
  );
}

function StatsLoading() {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-4">
      <StatCardShell label="Total Projects" icon={FolderKanban} href="/projects">
        <StatValue />
      </StatCardShell>
      <StatCardShell label="In Progress" icon={Gauge} href="/projects">
        <StatValue />
      </StatCardShell>
      <StatCardShell label="Monthly Revenue" icon={DollarSign} href="/financials">
        <StatValue className="w-20" />
      </StatCardShell>
      <StatCardShell label="Active Clients" icon={Users} href="/clients">
        <StatValue />
      </StatCardShell>
    </div>
  );
}

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

      {/* Stats Cards - shell renders instantly, numbers stream in */}
      <Suspense fallback={<StatsLoading />}>
        <DashboardStats />
      </Suspense>

      {/* Recent Projects - streams in after stats */}
      <Suspense fallback={<RecentProjectsLoading />}>
        <RecentProjects />
      </Suspense>
    </div>
  );
}
