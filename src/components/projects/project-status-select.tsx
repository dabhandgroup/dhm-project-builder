"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { projectStatuses, kanbanStatuses } from "@/constants/project-statuses";
import { updateProjectStatus } from "@/actions/projects";
import { toast } from "@/components/ui/toast";
import type { ProjectStatus } from "@/types/database";

interface ProjectStatusSelectProps {
  projectId: string;
  status: ProjectStatus;
}

export function ProjectStatusSelect({ projectId, status: initialStatus }: ProjectStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(newStatus: string) {
    const prev = status;
    setStatus(newStatus as ProjectStatus);

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
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className={`rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer appearance-none text-center ${config.bgColor} ${config.textColor} ${isPending ? "opacity-50" : ""}`}
      style={{ backgroundImage: "none" }}
    >
      {kanbanStatuses.map((s) => (
        <option key={s} value={s}>
          {projectStatuses[s].label}
        </option>
      ))}
    </select>
  );
}
