"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Globe, ExternalLink, ChevronDown } from "lucide-react";
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
  availableStatuses?: ProjectStatus[];
  onStatusChange?: (newStatus: ProjectStatus) => void;
}

export function ProjectCard({
  id,
  title,
  domain_name,
  status,
  recurring_revenue,
  preview_url,
  clientName,
  availableStatuses,
  onStatusChange,
}: ProjectCardProps) {
  const statusConfig = projectStatuses[status];
  const [showStatusMenu, setShowStatusMenu] = useState(false);

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

      {/* Status change button */}
      {onStatusChange && availableStatuses && (
        <div className="relative px-3.5 pb-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowStatusMenu(!showStatusMenu);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium w-full justify-between transition-colors",
              statusConfig.bgColor, statusConfig.textColor
            )}
          >
            <div className="flex items-center gap-1.5">
              <div className={cn("h-2 w-2 rounded-full", statusConfig.color.replace("text-", "bg-"))} />
              {statusConfig.label}
            </div>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showStatusMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowStatusMenu(false)}
              />
              <div className="absolute left-3.5 right-3.5 bottom-full mb-1 z-20 rounded-lg border bg-background shadow-lg py-1">
                {availableStatuses.map((s) => {
                  const cfg = projectStatuses[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(s);
                        setShowStatusMenu(false);
                      }}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-accent transition-colors text-left",
                        s === status && "font-semibold"
                      )}
                    >
                      <div className={cn("h-2 w-2 rounded-full", cfg.color.replace("text-", "bg-"))} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
