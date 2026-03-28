"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";
import type { ClientOption, TemplateOption } from "@/components/projects/project-form";
import { createProject, saveDraft, updateProject, addProjectImage } from "@/actions/projects";
import { createClientAction } from "@/actions/clients";
import { uploadProjectAsset, uploadProjectImage, uploadFaviconVariants } from "@/lib/storage";
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
      client_name,
      favicon: _fav,
      og_image: _og,
      logo: _logo,
      alt_logo: _alt,
      square_images: _sq,
      landscape_images: _ls,
      include_in_financials: _iif,
      ...rest
    } = data;

    // Create new client if name is provided but no existing client selected
    if (client_name && !rest.client_id) {
      const clientResult = await createClientAction({
        name: client_name,
        email: data.contact_info.email || undefined,
        phone: data.contact_info.phone || undefined,
        address: data.contact_info.address || undefined,
      });
      if (clientResult && "id" in clientResult) {
        rest.client_id = clientResult.id;
      }
    }

    let projectId = draftIdRef.current;

    if (projectId) {
      const result = await updateProject(projectId, rest);
      if (result && "error" in result) throw new Error(result.error);
      await saveCrawlData(projectId, crawl_data);
    } else {
      const result = await createProject(rest);
      if (result && "error" in result) throw new Error(result.error);
      if (result && "id" in result && result.id) {
        projectId = result.id;
        await saveCrawlData(result.id, crawl_data);
      }
    }

    if (projectId) {
      // Auto-start the build pipeline
      fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      }).catch(() => {});

      router.push(`/projects/${projectId}?new=1`);
    }
  }

  const crawlSavedRef = useRef(false);
  const uploadedFilesRef = useRef<Set<string>>(new Set());
  const clientCreatedRef = useRef(false);

  const handleSaveDraft = useCallback(async (data: ProjectFormData) => {
    // Create new client if needed (once)
    if (data.client_name && !data.client_id && !clientCreatedRef.current) {
      clientCreatedRef.current = true;
      try {
        const clientResult = await createClientAction({
          name: data.client_name,
          email: data.contact_info.email || undefined,
          phone: data.contact_info.phone || undefined,
          address: data.contact_info.address || undefined,
        });
        if (clientResult && "id" in clientResult) {
          data = { ...data, client_id: clientResult.id };
        }
      } catch {
        clientCreatedRef.current = false;
      }
    }

    const result = await saveDraft(data, draftIdRef.current ?? undefined);
    if (result && "error" in result) {
      throw new Error(result.error);
    }
    if (result && "id" in result && result.id) {
      draftIdRef.current = result.id;
    }

    const pid = draftIdRef.current;
    if (!pid) return;

    // Upload file assets to Supabase Storage (skip already-uploaded files)
    const assetUpdates: Record<string, string> = {};
    const assetFiles: { file: File | null; type: "favicon" | "og-image" | "logo" | "alt-logo"; dbField: string }[] = [
      { file: data.favicon, type: "favicon", dbField: "favicon_url" },
      { file: data.logo, type: "logo", dbField: "logo_url" },
      { file: data.alt_logo, type: "alt-logo", dbField: "alt_logo_url" },
    ];

    for (const { file, type, dbField } of assetFiles) {
      if (!file) continue;
      const fingerprint = `${type}-${file.name}-${file.size}`;
      if (uploadedFilesRef.current.has(fingerprint)) continue;
      try {
        const url = await uploadProjectAsset(pid, file, type);
        assetUpdates[dbField] = url;
        uploadedFilesRef.current.add(fingerprint);
      } catch (err) {
        console.error(`Failed to upload ${type}:`, err);
      }
    }

    // Upload square/landscape images
    for (const file of data.square_images) {
      const fingerprint = `square-${file.name}-${file.size}`;
      if (uploadedFilesRef.current.has(fingerprint)) continue;
      try {
        const url = await uploadProjectImage(pid, file, "square");
        await addProjectImage(pid, url, "square");
        uploadedFilesRef.current.add(fingerprint);
      } catch (err) {
        console.error("Failed to upload square image:", err);
      }
    }
    for (const file of data.landscape_images) {
      const fingerprint = `landscape-${file.name}-${file.size}`;
      if (uploadedFilesRef.current.has(fingerprint)) continue;
      try {
        const url = await uploadProjectImage(pid, file, "landscape");
        await addProjectImage(pid, url, "landscape");
        uploadedFilesRef.current.add(fingerprint);
      } catch (err) {
        console.error("Failed to upload landscape image:", err);
      }
    }

    // Upload favicon variants
    if (data.favicon_variants.length > 0 && !uploadedFilesRef.current.has("favicon-variants")) {
      try {
        await uploadFaviconVariants(pid, data.favicon_variants);
        uploadedFilesRef.current.add("favicon-variants");
      } catch (err) {
        console.error("Failed to upload favicon variants:", err);
      }
    }

    // Update project with asset URLs
    if (Object.keys(assetUpdates).length > 0) {
      await updateProject(pid, assetUpdates);
    }

    // Persist crawl data to storage
    if (data.crawl_data && !crawlSavedRef.current) {
      crawlSavedRef.current = true;
      fetch("/api/crawl/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: pid, crawlData: data.crawl_data }),
      }).catch(() => { crawlSavedRef.current = false; });
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
