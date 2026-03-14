"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import type { ClientOption, TemplateOption } from "@/components/projects/project-form";
import { createProject, saveDraft, updateProject } from "@/actions/projects";
import type { ProjectFormData } from "@/types/project";

interface ProjectFormWrapperProps {
  clients?: ClientOption[];
  templates?: TemplateOption[];
}

export function ProjectFormWrapper({ clients: initialClients, templates: initialTemplates }: ProjectFormWrapperProps) {
  const [clients, setClients] = useState<ClientOption[]>(initialClients ?? []);
  const [templates, setTemplates] = useState<TemplateOption[]>(initialTemplates ?? []);
  const draftIdRef = useRef<string | null>(null);
  const router = useRouter();

  // Fetch client/template options client-side if not provided via props
  useEffect(() => {
    if (initialClients && initialTemplates) return;

    fetch("/api/form-options")
      .then((res) => res.json())
      .then((data) => {
        if (data.clients) setClients(data.clients);
        if (data.templates) setTemplates(data.templates);
      })
      .catch(() => {});
  }, [initialClients, initialTemplates]);

  async function handleSubmit(data: ProjectFormData) {
    if (draftIdRef.current) {
      // Update existing draft — it's already in the DB as a "lead"
      await updateProject(draftIdRef.current, data);
    } else {
      await createProject(data);
    }
  }

  const handleSaveDraft = useCallback(async (data: ProjectFormData) => {
    const result = await saveDraft(data, draftIdRef.current ?? undefined);
    if (result && "id" in result && result.id) {
      draftIdRef.current = result.id;
      // Update URL so user can see draft exists, without a full reload
      router.replace(`/projects/new?draft=${result.id}`, { scroll: false });
    }
  }, [router]);

  return (
    <ProjectForm
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      clients={clients}
      templates={templates}
    />
  );
}
