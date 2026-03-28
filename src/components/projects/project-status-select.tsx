"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { projectStatuses, kanbanStatuses } from "@/constants/project-statuses";
import { updateProjectStatus } from "@/actions/projects";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import type { ProjectStatus } from "@/types/database";

const dotColors: Record<ProjectStatus, string> = {
  lead: "#71717a",
  initial_draft: "#3b82f6",
  awaiting_feedback: "#f59e0b",
  revisions: "#f97316",
  awaiting_payment: "#a855f7",
  complete: "#22c55e",
};

interface ProjectStatusSelectProps {
  projectId: string;
  status: ProjectStatus;
}

export function ProjectStatusSelect({ projectId, status: initialStatus }: ProjectStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(newStatus: ProjectStatus) {
    if (newStatus === status) return;
    const prev = status;
    setStatus(newStatus);

    startTransition(async () => {
      const result = await updateProjectStatus(projectId, newStatus);
      if (result.error) {
        setStatus(prev);
        toast({ title: "Failed to update status", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Status updated" });
        router.refresh();
      }
    });
  }

  const config = projectStatuses[status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium cursor-pointer transition-opacity ${config.bgColor} ${config.textColor} ${isPending ? "opacity-50" : "hover:opacity-80"}`}
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {config.label}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {kanbanStatuses.map((s) => {
          const sc = projectStatuses[s];
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => handleChange(s)}
              className="gap-2"
            >
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: dotColors[s] }}
              />
              <span className="flex-1">{sc.label}</span>
              {s === status && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
