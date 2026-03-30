"use client";

import { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/projects/kanban-board";
import { ProjectListView } from "@/components/projects/project-list-view";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import type { ProjectStatus } from "@/types/database";

interface ProjectData {
  id: string;
  title: string;
  domain_name: string | null;
  status: ProjectStatus;
  one_off_revenue: number;
  recurring_revenue: number;
  currency: string;
  ai_model: string | null;
  preview_url: string | null;
  created_at: string;
  clientName: string | null;
}

export function ProjectsViewToggle({ projects }: { projects: ProjectData[] }) {
  const [view, setView] = useState<"kanban" | "list">("kanban");

  useEffect(() => {
    const saved = localStorage.getItem("projects-view");
    if (saved === "kanban" || saved === "list") setView(saved);
  }, []);

  function toggleView(v: "kanban" | "list") {
    setView(v);
    localStorage.setItem("projects-view", v);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        <Button
          variant={view === "kanban" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => toggleView("kanban")}
        >
          <LayoutGrid className="h-4 w-4" />
          Kanban
        </Button>
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => toggleView("list")}
        >
          <List className="h-4 w-4" />
          List
        </Button>
      </div>

      {view === "kanban" ? (
        <KanbanBoard projects={projects} />
      ) : (
        <ProjectListView projects={projects} />
      )}
    </div>
  );
}
