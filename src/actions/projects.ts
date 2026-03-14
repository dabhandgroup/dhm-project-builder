"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProjectStatus } from "@/types/database";

export async function createProject(data: {
  title: string;
  domain_name?: string;
  is_rebuild?: boolean;
  client_id?: string;
  pages_required?: string;
  brief?: string;
  brief_summary?: string;
  contact_info?: { phone: string; email: string; address: string };
  google_maps_embed?: string;
  additional_notes?: string;
  sitemap_url?: string;
  target_locations?: string[];
  ai_model?: string;
  currency?: string;
  one_off_revenue?: number;
  recurring_revenue?: number;
  template_id?: string | null;
  deploy_provider?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      ...data,
      status: "lead" as ProjectStatus,
      created_by: user?.id,
      contact_info: data.contact_info ? JSON.parse(JSON.stringify(data.contact_info)) : null,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath("/");
  return { id: project.id };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProject(projectId: string, data: Record<string, any>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update(data as Record<string, unknown>)
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  return { success: true };
}

export async function updateProjectStatus(projectId: string, status: string) {
  return updateProject(projectId, { status });
}

export async function updateKanbanOrder(updates: { id: string; status: string; kanban_order: number }[]) {
  const supabase = await createClient();

  for (const update of updates) {
    const { error } = await supabase
      .from("projects")
      .update({ status: update.status, kanban_order: update.kanban_order })
      .eq("id", update.id);

    if (error) return { error: error.message };
  }

  revalidatePath("/projects");
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/projects");
  revalidatePath("/");
  return { success: true };
}

export async function addProjectImage(
  projectId: string,
  imageUrl: string,
  imageType: "square" | "landscape",
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_images")
    .insert({ project_id: projectId, image_url: imageUrl, image_type: imageType });

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveDraft(data: Record<string, any>, projectId?: string) {
  const supabase = await createClient();

  if (projectId) {
    return updateProject(projectId, data);
  }

  const { data: { user } } = await supabase.auth.getUser();
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      ...data,
      status: "lead" as ProjectStatus,
      created_by: user?.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/projects");
  return { id: project.id };
}

export async function deleteProjectImage(imageId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_images")
    .delete()
    .eq("id", imageId);

  if (error) return { error: error.message };

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
