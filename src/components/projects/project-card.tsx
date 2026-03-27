"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Globe, ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { projectStatuses } from "@/constants/project-statuses";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { DeleteProjectDialog } from "./delete-project-dialog";
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
  const router = useRouter();
  const statusConfig = projectStatuses[status];
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleted = useCallback(() => {
    setShowDeleteDialog(false);
    setIsDeleting(true);
    setTimeout(() => router.refresh(), 400);
  }, [router]);

  return (
    <>
      <div
        className={`group rounded-lg border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden ${
          isDeleting ? "opacity-0 scale-90 pointer-events-none" : "opacity-100 scale-100"
        }`}
        style={{ transition: "opacity 0.4s ease-out, transform 0.4s ease-out" }}
      >
        {/* Status accent bar */}
        <div className={cn("h-1", statusConfig.bgColor.replace("bg-", "bg-").replace("100", "400"))} />

        <div className="relative">
          {/* Actions menu */}
          <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-md p-1 hover:bg-accent"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => window.location.href = `/projects/${id}/edit`}>
                  <Pencil className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem destructive onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Link href={`/projects/${id}`} className="block p-3.5 space-y-2.5">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold leading-snug truncate pr-6">
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
        </div>

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

      <DeleteProjectDialog
        projectId={id}
        projectTitle={title}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDeleted={handleDeleted}
      />
    </>
  );
}
