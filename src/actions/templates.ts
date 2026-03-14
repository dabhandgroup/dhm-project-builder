"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTemplate(data: {
  name: string;
  description?: string;
  thumbnail_url?: string;
  storage_path: string;
  category?: string;
  framework?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: template, error } = await supabase
    .from("templates")
    .insert({ ...data, created_by: user?.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/templates");
  return { id: template.id };
}

export async function updateTemplate(id: string, data: {
  name?: string;
  description?: string;
  thumbnail_url?: string;
  storage_path?: string;
  category?: string;
  framework?: string;
  is_active?: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/templates");
  return { success: true };
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/templates");
  return { success: true };
}
