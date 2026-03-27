import type { ProjectStatus } from "@/types/database";

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

export const projectStatuses: Record<ProjectStatus, StatusConfig> = {
  lead: {
    label: "Lead",
    color: "text-zinc-500",
    bgColor: "bg-zinc-100",
    textColor: "text-zinc-700",
    borderColor: "border-zinc-300",
  },
  initial_draft: {
    label: "Initial Draft",
    color: "text-blue-500",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    borderColor: "border-blue-300",
  },
  awaiting_feedback: {
    label: "Feedback",
    color: "text-amber-500",
    bgColor: "bg-amber-100",
    textColor: "text-amber-700",
    borderColor: "border-amber-300",
  },
  revisions: {
    label: "Revisions",
    color: "text-orange-500",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
    borderColor: "border-orange-300",
  },
  awaiting_payment: {
    label: "Payment",
    color: "text-purple-500",
    bgColor: "bg-purple-100",
    textColor: "text-purple-700",
    borderColor: "border-purple-300",
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
  "lead",
  "initial_draft",
  "awaiting_feedback",
  "revisions",
  "awaiting_payment",
  "complete",
];
