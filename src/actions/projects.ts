"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ProjectFormData } from "@/types/project";
import type { ProjectStatus } from "@/types/database";

async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string | null> {
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) return null;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

export async function createProject(data: ProjectFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const projectId = crypto.randomUUID();
  const basePath = `projects/${projectId}`;

  // Upload files
  const [faviconUrl, logoUrl, altLogoUrl] = await Promise.all([
    data.favicon
      ? uploadFile("project-assets", `${basePath}/favicon`, data.favicon)
      : null,
    data.logo
      ? uploadFile("project-assets", `${basePath}/logo`, data.logo)
      : null,
    data.alt_logo
      ? uploadFile("project-assets", `${basePath}/alt-logo`, data.alt_logo)
      : null,
  ]);

  // Create or find client
  let clientId: string | null = null;
  if (data.client_name) {
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .ilike("name", data.client_name)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      const { data: newClient } = await supabase
        .from("clients")
        .insert({
          name: data.client_name,
          email: data.contact_info.email || null,
          phone: data.contact_info.phone || null,
          address: data.contact_info.address || null,
          created_by: user.id,
        })
        .select("id")
        .single();
      clientId = newClient?.id ?? null;
    }
  }

  // Insert project
  const { error: projectError } = await supabase.from("projects").insert({
    id: projectId,
    title: data.title,
    domain_name: data.domain_name || null,
    is_rebuild: data.is_rebuild,
    status: "draft",
    client_id: clientId,
    favicon_url: faviconUrl,
    logo_url: logoUrl,
    alt_logo_url: altLogoUrl,
    pages_required: data.pages_required || null,
    brief: data.brief || null,
    brief_summary: data.brief_summary || null,
    contact_info: data.contact_info,
    google_maps_embed: data.google_maps_embed || null,
    additional_notes: data.additional_notes || null,
    sitemap_url: data.sitemap_url || null,
    target_locations: data.target_locations.length > 0 ? data.target_locations : null,
    ai_model: data.ai_model || null,
    one_off_revenue: data.one_off_revenue,
    recurring_revenue: data.recurring_revenue,
    created_by: user.id,
  });

  if (projectError) throw new Error(projectError.message);

  // Upload project images
  const imageUploads: Promise<void>[] = [];

  for (let i = 0; i < data.square_images.length; i++) {
    const file = data.square_images[i];
    imageUploads.push(
      (async () => {
        const url = await uploadFile(
          "project-assets",
          `${basePath}/square/${i}-${file.name}`,
          file
        );
        if (url) {
          await supabase.from("project_images").insert({
            project_id: projectId,
            image_url: url,
            image_type: "square",
            sort_order: i,
          });
        }
      })()
    );
  }

  for (let i = 0; i < data.landscape_images.length; i++) {
    const file = data.landscape_images[i];
    imageUploads.push(
      (async () => {
        const url = await uploadFile(
          "project-assets",
          `${basePath}/landscape/${i}-${file.name}`,
          file
        );
        if (url) {
          await supabase.from("project_images").insert({
            project_id: projectId,
            image_url: url,
            image_type: "landscape",
            sort_order: i,
          });
        }
      })()
    );
  }

  await Promise.all(imageUploads);

  redirect(`/projects/${projectId}`);
}

export async function saveDraft(data: ProjectFormData, projectId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const projectData = {
    title: data.title || "Untitled Draft",
    domain_name: data.domain_name || null,
    is_rebuild: data.is_rebuild,
    status: "draft" as ProjectStatus,
    pages_required: data.pages_required || null,
    brief: data.brief || null,
    brief_summary: data.brief_summary || null,
    contact_info: data.contact_info,
    google_maps_embed: data.google_maps_embed || null,
    additional_notes: data.additional_notes || null,
    sitemap_url: data.sitemap_url || null,
    target_locations: data.target_locations.length > 0 ? data.target_locations : null,
    ai_model: data.ai_model || null,
    one_off_revenue: data.one_off_revenue,
    recurring_revenue: data.recurring_revenue,
  };

  if (projectId) {
    await supabase
      .from("projects")
      .update(projectData)
      .eq("id", projectId);
  } else {
    await supabase.from("projects").insert({
      ...projectData,
      created_by: user.id,
    });
  }
}

export async function updateProject(projectId: string, data: ProjectFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const basePath = `projects/${projectId}`;

  const [faviconUrl, logoUrl, altLogoUrl] = await Promise.all([
    data.favicon
      ? uploadFile("project-assets", `${basePath}/favicon`, data.favicon)
      : undefined,
    data.logo
      ? uploadFile("project-assets", `${basePath}/logo`, data.logo)
      : undefined,
    data.alt_logo
      ? uploadFile("project-assets", `${basePath}/alt-logo`, data.alt_logo)
      : undefined,
  ]);

  const updateData: Record<string, unknown> = {
    title: data.title,
    domain_name: data.domain_name || null,
    is_rebuild: data.is_rebuild,
    pages_required: data.pages_required || null,
    brief: data.brief || null,
    brief_summary: data.brief_summary || null,
    contact_info: data.contact_info,
    google_maps_embed: data.google_maps_embed || null,
    additional_notes: data.additional_notes || null,
    sitemap_url: data.sitemap_url || null,
    target_locations: data.target_locations.length > 0 ? data.target_locations : null,
    ai_model: data.ai_model || null,
    one_off_revenue: data.one_off_revenue,
    recurring_revenue: data.recurring_revenue,
  };

  if (faviconUrl !== undefined) updateData.favicon_url = faviconUrl;
  if (logoUrl !== undefined) updateData.logo_url = logoUrl;
  if (altLogoUrl !== undefined) updateData.alt_logo_url = altLogoUrl;

  const { error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  redirect(`/projects/${projectId}`);
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status })
    .eq("id", projectId);

  if (error) throw new Error(error.message);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  redirect("/projects");
}
