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
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, FolderKanban, DollarSign, Users, Gauge } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { projectStatuses } from "@/constants/project-statuses";
import { mockProjects, mockClients } from "@/lib/mock-data";
import type { ProjectStatus } from "@/types/database";

export default function DashboardPage() {
  const projects = mockProjects;
  const clientCount = mockClients.length;

  const activeProjects = projects.filter((p) => p.status !== "complete" && p.status !== "lead");
  const totalMRR = projects.reduce((sum, p) => sum + (p.recurring_revenue ?? 0), 0);
  const recentProjects = projects.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Welcome to DHM Project Builder">
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Link href="/projects" className="group">
          <Card className="transition-colors group-hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/projects" className="group">
          <Card className="transition-colors group-hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">In Progress</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{activeProjects.length}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/financials" className="group">
          <Card className="transition-colors group-hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{formatCurrency(totalMRR)}</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/clients" className="group">
          <Card className="transition-colors group-hover:bg-accent/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Active Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{clientCount}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Projects */}
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
    </div>
  );
}
