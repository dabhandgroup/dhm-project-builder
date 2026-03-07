"use client";

import Link from "next/link";
import { ProjectStatusBadge } from "./project-status-badge";
import { formatCurrency } from "@/lib/utils";
import { Globe, ExternalLink } from "lucide-react";
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
  dragHandleProps?: Record<string, unknown>;
}

export function ProjectCard({
  id,
  title,
  domain_name,
  status,
  recurring_revenue,
  ai_model,
  preview_url,
  clientName,
  dragHandleProps,
}: ProjectCardProps) {
  return (
    <div
      className="rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
      {...dragHandleProps}
    >
      <Link href={`/projects/${id}`} className="block space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight truncate">
            {title}
          </h3>
          <ProjectStatusBadge status={status} />
        </div>

        {domain_name && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="h-3 w-3" />
            <span className="truncate">{domain_name}</span>
          </div>
        )}

        {clientName && (
          <p className="text-xs text-muted-foreground truncate">
            {clientName}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-green-600">
            {formatCurrency(recurring_revenue)}/mo
          </span>
          {ai_model && (
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase">
              {ai_model}
            </span>
          )}
        </div>

        {preview_url && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <ExternalLink className="h-3 w-3" />
            <span>Preview</span>
          </div>
        )}
      </Link>
    </div>
  );
}
