"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
    ai_model: string | null;
    preview_url: string | null;
    clientName?: string | null;
  }[];
}

function SortableProjectCard(props: KanbanColumnProps["projects"][number]) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProjectCard {...props} />
    </div>
  );
}

export function KanbanColumn({ status, projects }: KanbanColumnProps) {
  const config = projectStatuses[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="min-w-[280px] w-[280px] shrink-0 snap-center">
      <div
        className={cn(
          "flex items-center gap-2 rounded-t-lg px-3 py-2",
          config.bgColor
        )}
      >
        <div
          className={cn("h-2.5 w-2.5 rounded-full", config.color.replace("text-", "bg-"))}
        />
        <h3 className={cn("text-sm font-semibold", config.textColor)}>
          {config.label}
        </h3>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-xs font-medium",
            config.bgColor,
            config.textColor
          )}
        >
          {projects.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[200px] space-y-2 rounded-b-lg border border-t-0 p-2 transition-colors",
          isOver && "bg-accent/50"
        )}
      >
        <SortableContext
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => (
            <SortableProjectCard key={project.id} {...project} />
          ))}
        </SortableContext>

        {projects.length === 0 && (
          <div className="flex h-[150px] items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
            Drag projects here
          </div>
        )}
      </div>
    </div>
  );
}
