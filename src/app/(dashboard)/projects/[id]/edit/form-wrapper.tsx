"use client";

import { useState, useRef, useCallback } from "react";
import { ProjectForm } from "@/components/projects/project-form";
import type { ClientOption, TemplateOption } from "@/components/projects/project-form";
import { ProjectStatusSelect } from "@/components/projects/project-status-select";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { updateProject, saveDraft, addProjectImage } from "@/actions/projects";
import { createClientAction } from "@/actions/clients";
import { uploadProjectAsset, uploadProjectImage, uploadFaviconVariants } from "@/lib/storage";
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
  const uploadedFilesRef = useRef<Set<string>>(new Set());

  async function handleSubmit(data: ProjectFormData) {
    const {
      is_manual: _im,
      crawl_data: _cd,
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

    // Create new client if name provided but no existing client selected
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

    await updateProject(projectId, rest);
  }

  const handleSaveDraft = useCallback(async (data: ProjectFormData) => {
    await saveDraft(data, projectId);

    // Upload file assets to Supabase Storage
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
        const url = await uploadProjectAsset(projectId, file, type);
        assetUpdates[dbField] = url;
        uploadedFilesRef.current.add(fingerprint);
      } catch (err) {
        console.error(`Failed to upload ${type}:`, err);
      }
    }

    for (const file of data.square_images) {
      const fingerprint = `square-${file.name}-${file.size}`;
      if (uploadedFilesRef.current.has(fingerprint)) continue;
      try {
        const url = await uploadProjectImage(projectId, file, "square");
        await addProjectImage(projectId, url, "square");
        uploadedFilesRef.current.add(fingerprint);
      } catch (err) {
        console.error("Failed to upload square image:", err);
      }
    }
    for (const file of data.landscape_images) {
      const fingerprint = `landscape-${file.name}-${file.size}`;
      if (uploadedFilesRef.current.has(fingerprint)) continue;
      try {
        const url = await uploadProjectImage(projectId, file, "landscape");
        await addProjectImage(projectId, url, "landscape");
        uploadedFilesRef.current.add(fingerprint);
      } catch (err) {
        console.error("Failed to upload landscape image:", err);
      }
    }

    // Upload favicon variants
    if (data.favicon_variants.length > 0 && !uploadedFilesRef.current.has("favicon-variants")) {
      try {
        await uploadFaviconVariants(projectId, data.favicon_variants);
        uploadedFilesRef.current.add("favicon-variants");
      } catch (err) {
        console.error("Failed to upload favicon variants:", err);
      }
    }

    if (Object.keys(assetUpdates).length > 0) {
      await updateProject(projectId, assetUpdates);
    }
  }, [projectId]);

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
