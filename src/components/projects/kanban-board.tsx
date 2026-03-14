"use client";

import { useState, useCallback } from "react";
import { KanbanColumn } from "./kanban-column";
import { kanbanStatuses } from "@/constants/project-statuses";
import { projectStatuses } from "@/constants/project-statuses";
import { updateProjectStatus } from "@/actions/projects";
import { toast } from "@/components/ui/toast";
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

export function KanbanBoard({ projects: initialProjects }: KanbanBoardProps) {
  const [projects, setProjects] = useState(initialProjects);

  const handleStatusChange = useCallback(
    async (projectId: string, newStatus: ProjectStatus) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project || project.status === newStatus) return;

      // Optimistic update
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, status: newStatus } : p
        )
      );

      try {
        await updateProjectStatus(projectId, newStatus);
        toast({
          title: `Moved to ${projectStatuses[newStatus].label}`,
        });
      } catch {
        // Revert on error
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectId ? { ...p, status: project.status } : p
          )
        );
        toast({
          title: "Failed to update status",
          variant: "destructive",
        });
      }
    },
    [projects]
  );

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
            onStatusChange={handleStatusChange}
          />
        );
      })}
    </div>
  );
}
