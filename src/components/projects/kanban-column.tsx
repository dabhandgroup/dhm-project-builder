"use client";

import { ProjectCard } from "./project-card";
import { projectStatuses } from "@/constants/project-statuses";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/database";

interface KanbanColumnProps {
  status: ProjectStatus;
  projects: {
    id: string;
    title: string;
    domain_name: string | null;
    status: ProjectStatus;
    recurring_revenue: number;
    currency?: string;
    ai_model: string | null;
    preview_url: string | null;
    clientName?: string | null;
  }[];
}

export function KanbanColumn({ status, projects }: KanbanColumnProps) {
  const config = projectStatuses[status];

  return (
    <div className="min-w-[300px] w-[300px] shrink-0 snap-center">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-t-lg px-4 py-3 border border-b-0",
          config.bgColor
        )}
      >
        <div
          className={cn("h-2.5 w-2.5 rounded-full ring-2 ring-white/50", config.color.replace("text-", "bg-"))}
        />
        <h3 className={cn("text-sm font-semibold", config.textColor)}>
          {config.label}
        </h3>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold bg-white/60",
            config.textColor
          )}
        >
          {projects.length}
        </span>
      </div>

      <div
        className="min-h-[400px] space-y-2.5 rounded-b-lg border border-t-0 bg-muted/30 p-2.5"
      >
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            {...project}
          />
        ))}

        {projects.length === 0 && (
          <div className="flex h-[150px] items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            No projects
          </div>
        )}
      </div>
    </div>
  );
}
