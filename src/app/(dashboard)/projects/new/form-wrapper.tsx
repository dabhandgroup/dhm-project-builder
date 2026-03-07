"use client";

import { ProjectForm } from "@/components/projects/project-form";
import { createProject, saveDraft } from "@/actions/projects";
import type { ProjectFormData } from "@/types/project";

export function ProjectFormWrapper() {
  async function handleSubmit(data: ProjectFormData) {
    await createProject(data);
  }

  async function handleSaveDraft(data: ProjectFormData) {
    await saveDraft(data);
  }

  return (
    <ProjectForm onSubmit={handleSubmit} onSaveDraft={handleSaveDraft} />
  );
}
