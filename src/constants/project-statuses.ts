import type { ProjectStatus } from "@/types/database";

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const projectStatuses: Record<ProjectStatus, StatusConfig> = {
  draft: {
    label: "Draft",
    color: "text-zinc-500",
    bgColor: "bg-zinc-100",
    textColor: "text-zinc-700",
    borderColor: "border-zinc-300",
  },
  initial_draft: {
    label: "Initial Draft",
    color: "text-red-500",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    borderColor: "border-red-300",
  },
  revisions: {
    label: "Revisions",
    color: "text-orange-500",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
    borderColor: "border-orange-300",
  },
  complete: {
    label: "Complete",
    color: "text-green-500",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    borderColor: "border-green-300",
  },
};

export const kanbanStatuses: ProjectStatus[] = [
  "initial_draft",
  "revisions",
  "complete",
];
