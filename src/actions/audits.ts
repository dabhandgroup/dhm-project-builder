"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Json } from "@/types/database";

export async function createAudit(data: {
  current_url: string;
  new_url: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: audit, error } = await supabase
    .from("audits")
    .insert({ ...data, created_by: user?.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/audit");
  return { id: audit.id };
}

export async function updateAudit(id: string, data: {
  status?: string;
  gtmetrix_before?: Json;
  gtmetrix_after?: Json;
  pagespeed_before?: Json;
  pagespeed_after?: Json;
  report_pdf_url?: string;
  completed_at?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("audits")
    .update(data)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/audit");
  revalidatePath(`/audit/${id}`);
  return { success: true };
}

export async function deleteAudit(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("audits")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/audit");
  return { success: true };
}
