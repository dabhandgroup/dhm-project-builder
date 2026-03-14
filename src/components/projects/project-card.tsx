"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Globe, ExternalLink } from "lucide-react";
import { projectStatuses } from "@/constants/project-statuses";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/database";

interface ProjectCardProps {
  id: string;
  title: string;
  domain_name: string | null;
  status: ProjectStatus;
  recurring_revenue: number;
  ai_model: string | null;
  preview_url: string | null;
  clientName?: string | null;
}

export function ProjectCard({
  id,
  title,
  domain_name,
  status,
  recurring_revenue,
  preview_url,
  clientName,
}: ProjectCardProps) {
  const statusConfig = projectStatuses[status];

  return (
    <div className="group rounded-lg border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Status accent bar */}
      <div className={cn("h-1", statusConfig.bgColor.replace("bg-", "bg-").replace("100", "400"))} />

      <Link href={`/projects/${id}`} className="block p-3.5 space-y-2.5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug truncate">
            {title}
          </h3>
          {clientName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {clientName}
            </p>
          )}
        </div>

        {domain_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="h-3 w-3 shrink-0" />
            <span className="truncate">{domain_name}</span>
          </div>
        )}

        {preview_url && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate">{preview_url.replace("https://", "")}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-dashed">
          <span className="text-sm font-bold text-green-600">
            {formatCurrency(recurring_revenue)}/mo
          </span>
        </div>
      </Link>

      {/* Status badge (read-only) */}
      <div className="px-3.5 pb-3">
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
            statusConfig.bgColor, statusConfig.textColor
          )}
        >
          <div className={cn("h-2 w-2 rounded-full", statusConfig.color.replace("text-", "bg-"))} />
          {statusConfig.label}
        </div>
      </div>
    </div>
  );
}
