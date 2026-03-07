"use client";

import { ProjectForm } from "@/components/projects/project-form";
import { updateProject, saveDraft } from "@/actions/projects";
import type { ProjectFormData } from "@/types/project";

interface EditProjectFormWrapperProps {
  projectId: string;
  initialData: Partial<ProjectFormData>;
}

export function EditProjectFormWrapper({
  projectId,
  initialData,
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
    />
  );
}
