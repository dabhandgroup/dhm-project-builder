"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectStatusBadge } from "./project-status-badge";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateProjectStatus } from "@/actions/projects";
import { toast } from "@/components/ui/toast";
import { ArrowUpDown, ExternalLink, Trash2 } from "lucide-react";
import { kanbanStatuses } from "@/constants/project-statuses";
import { projectStatuses } from "@/constants/project-statuses";
import { DeleteProjectDialog } from "./delete-project-dialog";
import type { ProjectStatus } from "@/types/database";

interface ListProject {
  id: string;
  title: string;
  domain_name: string | null;
  status: ProjectStatus;
  one_off_revenue: number;
  recurring_revenue: number;
  preview_url: string | null;
  created_at: string;
  clientName?: string | null;
}

interface ProjectListViewProps {
  projects: ListProject[];
}

type SortKey = "title" | "status" | "recurring_revenue" | "created_at";

export function ProjectListView({
  projects: initialProjects,
}: ProjectListViewProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const sorted = [...projects].sort((a, b) => {
    const aVal = a[sortKey] ?? "";
    const bVal = b[sortKey] ?? "";
    const cmp = String(aVal).localeCompare(String(bVal), undefined, {
      numeric: true,
    });
    return sortAsc ? cmp : -cmp;
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  async function handleStatusChange(
    projectId: string,
    newStatus: ProjectStatus
  ) {
    const prevStatus = projects.find((p) => p.id === projectId)?.status;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, status: newStatus } : p
      )
    );
    const result = await updateProjectStatus(projectId, newStatus);
    if (result.error) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, status: prevStatus ?? newStatus } : p
        )
      );
      toast({
        title: "Failed to update status",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: "Status updated" });
      router.refresh();
    }
  }

  const handleDeleted = useCallback(() => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setDeletingId(id);
    // Let the animation play, then remove from state
    setTimeout(() => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setDeletingId(null);
      router.refresh();
    }, 400);
  }, [deleteTarget, router]);

  const SortHeader = ({
    label,
    sortKeyVal,
  }: {
    label: string;
    sortKeyVal: SortKey;
  }) => (
    <button
      type="button"
      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      onClick={() => toggleSort(sortKeyVal)}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <>
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left">
              <SortHeader label="Title" sortKeyVal="title" />
            </th>
            <th className="px-3 py-2 text-left hidden sm:table-cell">
              Domain
            </th>
            <th className="px-3 py-2 text-left">
              <SortHeader label="Status" sortKeyVal="status" />
            </th>
            <th className="px-3 py-2 text-right hidden md:table-cell">
              <SortHeader label="MRR" sortKeyVal="recurring_revenue" />
            </th>
            <th className="px-3 py-2 text-left hidden lg:table-cell">
              <SortHeader label="Created" sortKeyVal="created_at" />
            </th>
            <th className="px-3 py-2 w-10" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((project) => (
            <tr
              key={project.id}
              className={`border-b last:border-0 hover:bg-muted/30 transition-all duration-400 origin-center ${
                deletingId === project.id
                  ? "opacity-0 scale-95 h-0 overflow-hidden"
                  : "opacity-100 scale-100"
              }`}
              style={deletingId === project.id ? { transition: "opacity 0.4s ease-out, transform 0.4s ease-out" } : undefined}
            >
              <td className="px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-medium hover:underline truncate"
                  >
                    {project.title}
                  </Link>
                  {project.clientName && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {project.clientName}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 hidden sm:table-cell">
                <span className="text-xs text-muted-foreground">
                  {project.domain_name || "—"}
                </span>
                {project.preview_url && (
                  <a
                    href={project.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex"
                  >
                    <ExternalLink className="h-3 w-3 text-blue-500" />
                  </a>
                )}
              </td>
              <td className="px-3 py-2">
                <Select
                  value={project.status}
                  onChange={(e) =>
                    handleStatusChange(
                      project.id,
                      e.target.value as ProjectStatus
                    )
                  }
                  options={kanbanStatuses.map((s) => ({
                    value: s,
                    label: projectStatuses[s].label,
                  }))}
                  className="text-xs h-7"
                />
              </td>
              <td className="px-3 py-2 text-right hidden md:table-cell">
                <span className="text-xs font-medium text-green-600">
                  {formatCurrency(project.recurring_revenue)}
                </span>
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground hidden lg:table-cell">
                {formatDate(project.created_at)}
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => setDeleteTarget({ id: project.id, title: project.title })}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {deleteTarget && (
      <DeleteProjectDialog
        projectId={deleteTarget.id}
        projectTitle={deleteTarget.title}
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDeleted={handleDeleted}
      />
    )}
    </>
  );
}
