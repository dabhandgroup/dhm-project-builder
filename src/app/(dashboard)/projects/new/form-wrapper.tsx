"use client";

import { useState, useEffect } from "react";
import { ProjectForm } from "@/components/projects/project-form";
import type { ClientOption, TemplateOption } from "@/components/projects/project-form";
import { createProject, saveDraft } from "@/actions/projects";
import type { ProjectFormData } from "@/types/project";

interface ProjectFormWrapperProps {
  clients?: ClientOption[];
  templates?: TemplateOption[];
}

export function ProjectFormWrapper({ clients: initialClients, templates: initialTemplates }: ProjectFormWrapperProps) {
  const [clients, setClients] = useState<ClientOption[]>(initialClients ?? []);
  const [templates, setTemplates] = useState<TemplateOption[]>(initialTemplates ?? []);

  // Fetch client/template options client-side if not provided via props
  useEffect(() => {
    if (initialClients && initialTemplates) return;

    fetch("/api/form-options")
      .then((res) => res.json())
      .then((data) => {
        if (data.clients) setClients(data.clients);
        if (data.templates) setTemplates(data.templates);
      })
      .catch(() => {
        // Silent fail — form still works, just without client/template options
      });
  }, [initialClients, initialTemplates]);

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
