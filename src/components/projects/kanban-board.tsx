"use client";

import { KanbanColumn } from "./kanban-column";
import { kanbanStatuses } from "@/constants/project-statuses";
import type { ProjectStatus } from "@/types/database";

interface KanbanProject {
  id: string;
  title: string;
  domain_name: string | null;
  status: ProjectStatus;
  recurring_revenue: number;
  ai_model: string | null;
  preview_url: string | null;
  clientName?: string | null;
}

interface KanbanBoardProps {
  projects: KanbanProject[];
}

export function KanbanBoard({ projects }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
      {kanbanStatuses.map((status) => {
        const columnProjects = projects.filter(
          (p) => p.status === status
        );
        return (
          <KanbanColumn
            key={status}
            status={status}
            projects={columnProjects}
          />
        );
      })}
    </div>
  );
}
