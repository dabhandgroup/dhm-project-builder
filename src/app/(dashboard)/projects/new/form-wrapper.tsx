"use client";

import { ProjectForm } from "@/components/projects/project-form";
import type { ClientOption, TemplateOption } from "@/components/projects/project-form";
import { createProject, saveDraft } from "@/actions/projects";
import type { ProjectFormData } from "@/types/project";

interface ProjectFormWrapperProps {
  clients: ClientOption[];
  templates: TemplateOption[];
}

export function ProjectFormWrapper({ clients, templates }: ProjectFormWrapperProps) {
  async function handleSubmit(data: ProjectFormData) {
    await createProject(data);
  }

  async function handleSaveDraft(data: ProjectFormData) {
    await saveDraft(data);
  }

  return (
    <ProjectForm
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      clients={clients}
      templates={templates}
    />
  );
}
