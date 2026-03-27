"use client";

import { useState } from "react";
import { ProjectForm } from "@/components/projects/project-form";
import type { ClientOption, TemplateOption } from "@/components/projects/project-form";
import { ProjectStatusSelect } from "@/components/projects/project-status-select";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { updateProject, saveDraft } from "@/actions/projects";
import type { ProjectFormData } from "@/types/project";
import type { ProjectStatus } from "@/types/database";

interface EditProjectFormWrapperProps {
  projectId: string;
  projectTitle: string;
  status: ProjectStatus;
  initialData: Partial<ProjectFormData>;
  clients: ClientOption[];
  templates: TemplateOption[];
}

export function EditProjectFormWrapper({
  projectId,
  projectTitle,
  status,
  initialData,
  clients,
  templates,
}: EditProjectFormWrapperProps) {
  const [showDelete, setShowDelete] = useState(false);

  async function handleSubmit(data: ProjectFormData) {
    const { is_manual: _im, ...rest } = data;
    await updateProject(projectId, rest);
  }

  async function handleSaveDraft(data: ProjectFormData) {
    await saveDraft(data, projectId);
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm font-medium text-muted-foreground">Status</span>
        <ProjectStatusSelect projectId={projectId} status={status} />
      </div>
      <ProjectForm
        initialData={initialData}
        projectId={projectId}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        onDelete={() => setShowDelete(true)}
        isEditing
        clients={clients}
        templates={templates}
      />
      <DeleteProjectDialog
        projectId={projectId}
        projectTitle={projectTitle}
        open={showDelete}
        onOpenChange={setShowDelete}
      />
    </>
  );
}
