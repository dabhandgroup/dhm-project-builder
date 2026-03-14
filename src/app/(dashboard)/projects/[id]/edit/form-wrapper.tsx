"use client";

import { ProjectForm } from "@/components/projects/project-form";
import type { ClientOption, TemplateOption } from "@/components/projects/project-form";
import { updateProject, saveDraft } from "@/actions/projects";
import type { ProjectFormData } from "@/types/project";

interface EditProjectFormWrapperProps {
  projectId: string;
  initialData: Partial<ProjectFormData>;
  clients: ClientOption[];
  templates: TemplateOption[];
}

export function EditProjectFormWrapper({
  projectId,
  initialData,
  clients,
  templates,
}: EditProjectFormWrapperProps) {
  async function handleSubmit(data: ProjectFormData) {
    await updateProject(projectId, data);
  }

  async function handleSaveDraft(data: ProjectFormData) {
    await saveDraft(data, projectId);
  }

  return (
    <ProjectForm
      initialData={initialData}
      projectId={projectId}
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      isEditing
      clients={clients}
      templates={templates}
    />
  );
}
