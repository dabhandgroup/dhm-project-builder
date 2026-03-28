"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database";

export async function createContentPlan(data: {
  project_id?: string | null;
  plan_data?: Json;
  google_sheet_url?: string;
  google_doc_url?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: plan, error } = await supabase
    .from("content_plans")
    .insert({ ...data, created_by: user?.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/content");
  return { id: plan.id };
}

export async function updateContentPlan(id: string, data: {
  plan_data?: Json;
  google_sheet_url?: string;
  google_doc_url?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_plans")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/content");
  return { success: true };
}

export async function deleteContentPlan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_plans")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/content");
  return { success: true };
}
