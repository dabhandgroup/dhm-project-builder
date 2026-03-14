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
      className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
      {...dragHandleProps}
    >
      <Link href={`/projects/${id}`} className="block space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug">
            {title}
          </h3>
          <ProjectStatusBadge status={status} />
        </div>

        {clientName && (
          <p className="text-xs text-muted-foreground">
            {clientName}
          </p>
        )}

        {domain_name && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{domain_name}</span>
          </div>
        )}

        {preview_url && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600">
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{preview_url}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t">
          <span className="text-sm font-semibold text-green-600">
            {formatCurrency(recurring_revenue)}/mo
          </span>
          {ai_model && (
            <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
              {ai_model}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
