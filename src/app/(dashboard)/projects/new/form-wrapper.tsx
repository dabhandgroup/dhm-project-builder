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
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[]>(initialClients ?? []);
  const [templates, setTemplates] = useState<TemplateOption[]>(initialTemplates ?? []);
  const draftIdRef = useRef<string | null>(null);

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

  async function saveCrawlData(projectId: string, crawlData: ProjectFormData["crawl_data"]) {
    if (!crawlData) return;
    try {
      await fetch("/api/crawl/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, crawlData }),
      });
    } catch {
      // Non-fatal — crawl data is supplementary
      console.error("Failed to save crawl data");
    }
  }

  async function handleSubmit(data: ProjectFormData) {
    const {
      crawl_data,
      is_manual: _im,
      client_name: _cn,
      favicon: _fav,
      og_image: _og,
      logo: _logo,
      alt_logo: _alt,
      square_images: _sq,
      landscape_images: _ls,
      include_in_financials: _iif,
      ...rest
    } = data;

    let projectId = draftIdRef.current;

    if (projectId) {
      await updateProject(projectId, rest);
      await saveCrawlData(projectId, crawl_data);
    } else {
      const result = await createProject(rest);
      if (result && "id" in result && result.id) {
        projectId = result.id;
        await saveCrawlData(result.id, crawl_data);
      }
    }

    if (projectId) {
      router.push(`/projects/${projectId}?new=1`);
    }
  }

  const handleSaveDraft = useCallback(async (data: ProjectFormData) => {
    const result = await saveDraft(data, draftIdRef.current ?? undefined);
    if (result && "error" in result) {
      throw new Error(result.error);
    }
    if (result && "id" in result && result.id) {
      draftIdRef.current = result.id;
    }
  }, []);

  return (
    <ProjectForm
      onSubmit={handleSubmit}
      onSaveDraft={handleSaveDraft}
      clients={clients}
      templates={templates}
    />
  );
}
