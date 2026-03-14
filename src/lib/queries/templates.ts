import { createClient } from "@/lib/supabase/server";

export async function getTemplates(activeOnly = true) {
  const supabase = await createClient();
  let query = supabase
    .from("templates")
    .select("*")
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getTemplateById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
